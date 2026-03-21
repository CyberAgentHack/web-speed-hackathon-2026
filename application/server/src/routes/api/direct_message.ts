import { Router } from 'express';
import httpErrors from 'http-errors';
import { literal, Op } from 'sequelize';

import { eventhub } from '@web-speed-hackathon-2026/server/src/eventhub';
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from '@web-speed-hackathon-2026/server/src/models';

export const directMessageRouter = Router();

directMessageRouter.get('/dm', async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const userId = req.session.userId;
  const escapedUserId = DirectMessageConversation.sequelize!.escape(userId);

  const hasMessages = literal(`EXISTS (
    SELECT 1
      FROM "DirectMessages" AS "DirectMessage"
     WHERE "DirectMessage"."conversationId" = "DirectMessageConversation"."id"
  )`);
  const latestMessageCreatedAt = literal(`(
    SELECT MAX("DirectMessage"."createdAt")
      FROM "DirectMessages" AS "DirectMessage"
     WHERE "DirectMessage"."conversationId" = "DirectMessageConversation"."id"
  )`);
  const unreadCount = literal(`(
    SELECT COUNT(*)
      FROM "DirectMessages" AS "UnreadMessage"
     WHERE "UnreadMessage"."conversationId" = "DirectMessageConversation"."id"
       AND "UnreadMessage"."senderId" != ${escapedUserId}
       AND "UnreadMessage"."isRead" = false
  )`);

  const conversations = await DirectMessageConversation.unscoped().findAll({
    attributes: {
      include: [[unreadCount, 'unreadCount']],
    },
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
        },
        hasMessages,
      ],
    },
    order: [[latestMessageCreatedAt, 'DESC']],
    include: [
      {
        association: 'initiator',
        attributes: [
          'id',
          'description',
          'name',
          'username',
          'createdAt',
          'updatedAt',
        ],
        include: [{ association: 'profileImage', attributes: ['id', 'alt'] }],
      },
      {
        association: 'member',
        attributes: [
          'id',
          'description',
          'name',
          'username',
          'createdAt',
          'updatedAt',
        ],
        include: [{ association: 'profileImage', attributes: ['id', 'alt'] }],
      },
      {
        association: 'messages',
        attributes: [
          'id',
          'body',
          'isRead',
          'createdAt',
          'updatedAt',
          'senderId',
        ],
        include: [{ association: 'sender', attributes: ['id'] }],
        limit: 1,
        order: [['createdAt', 'DESC']],
        required: false,
        separate: true,
      },
    ],
  });

  return res
    .status(200)
    .type('application/json')
    .send(
      conversations.map((c) => ({
        ...c.toJSON(),
        unreadCount: Number(c.get('unreadCount') ?? 0),
      })),
    );
});

directMessageRouter.post('/dm', async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const peer = await User.findByPk(req.body?.peerId);
  if (peer === null) {
    throw new httpErrors.NotFound();
  }

  const [conversation] = await DirectMessageConversation.findOrCreate({
    where: {
      [Op.or]: [
        { initiatorId: req.session.userId, memberId: peer.id },
        { initiatorId: peer.id, memberId: req.session.userId },
      ],
    },
    defaults: {
      initiatorId: req.session.userId,
      memberId: peer.id,
    },
  });
  await conversation.reload();

  return res.status(200).type('application/json').send(conversation);
});

directMessageRouter.ws('/dm/unread', async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const handler = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: 'dm:unread', payload }));
  };

  eventhub.on(`dm:unread/${req.session.userId}`, handler);
  req.ws.on('close', () => {
    eventhub.off(`dm:unread/${req.session.userId}`, handler);
  });

  const unreadCount = await DirectMessage.unscoped().count({
    where: {
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    include: [
      {
        association: 'conversation',
        attributes: [],
        where: {
          [Op.or]: [
            { initiatorId: req.session.userId },
            { memberId: req.session.userId },
          ],
        },
        required: true,
      },
    ],
  });

  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.get('/dm/:conversationId', async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
    },
    include: [
      {
        association: 'messages',
        include: [
          { association: 'sender', include: [{ association: 'profileImage' }] },
        ],
        order: [['createdAt', 'ASC']],
        required: false,
        separate: true,
      },
    ],
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type('application/json').send(conversation);
});

directMessageRouter.ws('/dm/:conversationId', async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
    attributes: ['id', 'initiatorId', 'memberId'],
    where: {
      id: req.params.conversationId,
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
    },
  });
  if (conversation == null) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== req.session.userId
      ? conversation.initiatorId
      : conversation.memberId;

  const handleMessageUpdated = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: 'dm:conversation:message', payload }));
  };
  eventhub.on(
    `dm:conversation/${conversation.id}:message`,
    handleMessageUpdated,
  );
  req.ws.on('close', () => {
    eventhub.off(
      `dm:conversation/${conversation.id}:message`,
      handleMessageUpdated,
    );
  });

  const handleTyping = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: 'dm:conversation:typing', payload }));
  };
  eventhub.on(
    `dm:conversation/${conversation.id}:typing/${peerId}`,
    handleTyping,
  );
  req.ws.on('close', () => {
    eventhub.off(
      `dm:conversation/${conversation.id}:typing/${peerId}`,
      handleTyping,
    );
  });
});

directMessageRouter.post('/dm/:conversationId/messages', async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const body: unknown = req.body?.body;
  if (typeof body !== 'string' || body.trim().length === 0) {
    throw new httpErrors.BadRequest();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
    attributes: ['id'],
    where: {
      id: req.params.conversationId,
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const message = await DirectMessage.create({
    body: body.trim(),
    conversationId: conversation.id,
    senderId: req.session.userId,
  });
  await message.reload();

  return res.status(201).type('application/json').send(message);
});

directMessageRouter.post('/dm/:conversationId/read', async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
    attributes: ['id', 'initiatorId', 'memberId'],
    where: {
      id: req.params.conversationId,
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== req.session.userId
      ? conversation.initiatorId
      : conversation.memberId;

  await DirectMessage.update(
    { isRead: true },
    {
      where: {
        conversationId: conversation.id,
        senderId: peerId,
        isRead: false,
      },
      individualHooks: true,
    },
  );

  return res.status(200).type('application/json').send({});
});

directMessageRouter.post('/dm/:conversationId/typing', async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
    attributes: ['id'],
    where: {
      id: req.params.conversationId,
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(
    `dm:conversation/${conversation.id}:typing/${req.session.userId}`,
    {},
  );

  return res.status(200).type('application/json').send({});
});
