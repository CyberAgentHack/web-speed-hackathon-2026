import { Router } from "express";
import httpErrors from "http-errors";
import { Op, QueryTypes } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();

const conversationParticipantInclude = [
  { association: "initiator", include: [{ association: "profileImage" }] },
  { association: "member", include: [{ association: "profileImage" }] },
];

const conversationMessagesInclude = [
  {
    association: "messages",
    include: [{ association: "sender", include: [{ association: "profileImage" }] }],
    order: [
      ["createdAt", "ASC"],
      ["id", "ASC"],
    ],
    required: false,
    separate: true,
  },
];

interface DirectMessageConversationSummaryRow {
  id: string;
  initiatorId: string;
  initiatorUsername: string;
  initiatorName: string;
  initiatorDescription: string;
  initiatorCreatedAt: string;
  initiatorProfileImageId: string;
  initiatorProfileImageAlt: string;
  memberId: string;
  memberUsername: string;
  memberName: string;
  memberDescription: string;
  memberCreatedAt: string;
  memberProfileImageId: string;
  memberProfileImageAlt: string;
  lastMessageBody: string;
  lastMessageCreatedAt: string;
  hasUnread: number;
}

function normalizeDateTime(value: string | Date) {
  return new Date(value).toISOString();
}

async function findConversationForUser(userId: string, conversationId: string) {
  return DirectMessageConversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
}

async function findConversationDetailsForUser(userId: string, conversationId: string) {
  return DirectMessageConversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
    include: [...conversationParticipantInclude, ...conversationMessagesInclude],
  });
}

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.sequelize!.query<
    DirectMessageConversationSummaryRow
  >(
    `select
      c.id as id,
      initiator.id as initiatorId,
      initiator.username as initiatorUsername,
      initiator.name as initiatorName,
      initiator.description as initiatorDescription,
      initiator.createdAt as initiatorCreatedAt,
      initiator_profile_image.id as initiatorProfileImageId,
      initiator_profile_image.alt as initiatorProfileImageAlt,
      member.id as memberId,
      member.username as memberUsername,
      member.name as memberName,
      member.description as memberDescription,
      member.createdAt as memberCreatedAt,
      member_profile_image.id as memberProfileImageId,
      member_profile_image.alt as memberProfileImageAlt,
      last_message.body as lastMessageBody,
      last_message.createdAt as lastMessageCreatedAt,
      exists(
        select 1
        from DirectMessages unread_message
        where unread_message.conversationId = c.id
          and unread_message.senderId != :userId
          and unread_message.isRead = 0
        limit 1
      ) as hasUnread
    from DirectMessageConversations c
    inner join Users initiator on initiator.id = c.initiatorId
    inner join ProfileImages initiator_profile_image
      on initiator_profile_image.id = initiator.profileImageId
    inner join Users member on member.id = c.memberId
    inner join ProfileImages member_profile_image
      on member_profile_image.id = member.profileImageId
    inner join DirectMessages last_message
      on last_message.id = (
        select message.id
        from DirectMessages message
        where message.conversationId = c.id
        order by message.createdAt desc
        limit 1
      )
    where c.initiatorId = :userId or c.memberId = :userId
    order by last_message.createdAt desc`,
    {
      replacements: { userId: req.session.userId },
      type: QueryTypes.SELECT,
    },
  );

  return res.status(200).type("application/json").send(
    conversations.map((conversation) => ({
      id: conversation.id,
      initiator: {
        id: conversation.initiatorId,
        username: conversation.initiatorUsername,
        name: conversation.initiatorName,
        description: conversation.initiatorDescription,
        createdAt: normalizeDateTime(conversation.initiatorCreatedAt),
        profileImage: {
          id: conversation.initiatorProfileImageId,
          alt: conversation.initiatorProfileImageAlt,
        },
      },
      member: {
        id: conversation.memberId,
        username: conversation.memberUsername,
        name: conversation.memberName,
        description: conversation.memberDescription,
        createdAt: normalizeDateTime(conversation.memberCreatedAt),
        profileImage: {
          id: conversation.memberProfileImageId,
          alt: conversation.memberProfileImageAlt,
        },
      },
      lastMessage: {
        body: conversation.lastMessageBody,
        createdAt: normalizeDateTime(conversation.lastMessageCreatedAt),
      },
      hasUnread: Boolean(conversation.hasUnread),
    })),
  );
});

directMessageRouter.post("/dm", async (req, res) => {
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
  const fullConversation = await DirectMessageConversation.findByPk(conversation.id, {
    include: conversationParticipantInclude,
  });

  if (fullConversation == null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(fullConversation);
});

directMessageRouter.ws("/dm/unread", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const handler = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:unread", payload }));
  };

  eventhub.on(`dm:unread/${req.session.userId}`, handler);
  req.ws.on("close", () => {
    eventhub.off(`dm:unread/${req.session.userId}`, handler);
  });

  const unreadCount = await DirectMessage.count({
    distinct: true,
    where: {
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    include: [
      {
        association: "conversation",
        where: {
          [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
        },
        required: true,
      },
    ],
  });

  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationDetailsForUser(
    req.session.userId,
    req.params.conversationId,
  );
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(conversation);
});

directMessageRouter.ws("/dm/:conversationId", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationForUser(req.session.userId, req.params.conversationId);
  if (conversation == null) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== req.session.userId
      ? conversation.initiatorId
      : conversation.memberId;

  const handleMessageUpdated = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:message", payload }));
  };
  eventhub.on(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
  req.ws.on("close", () => {
    eventhub.off(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
  });

  const handleTyping = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
  };
  eventhub.on(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
  req.ws.on("close", () => {
    eventhub.off(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
  });
});

directMessageRouter.post("/dm/:conversationId/messages", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const body: unknown = req.body?.body;
  if (typeof body !== "string" || body.trim().length === 0) {
    throw new httpErrors.BadRequest();
  }

  const conversation = await findConversationForUser(req.session.userId, req.params.conversationId);
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const message = await DirectMessage.create({
    body: body.trim(),
    conversationId: conversation.id,
    senderId: req.session.userId,
  });
  await message.reload();

  return res.status(201).type("application/json").send(message);
});

directMessageRouter.post("/dm/:conversationId/read", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationForUser(req.session.userId, req.params.conversationId);
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
      where: { conversationId: conversation.id, senderId: peerId, isRead: false },
      individualHooks: true,
    },
  );

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findByPk(req.params.conversationId);
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
