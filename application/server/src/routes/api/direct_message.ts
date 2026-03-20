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

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const userId = req.session.userId;

  // Step 1: Get conversations with participants only (no messages)
  const conversations = await DirectMessageConversation.scope("withParticipants").findAll({
    where: {
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });

  if (conversations.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const conversationIds = conversations.map((c) => c.id);

  // Step 2: Get latest message ID per conversation using window function
  const sequelize = DirectMessage.sequelize!;
  const latestMessageRows = await sequelize.query<{ id: string; conversationId: string }>(
    `SELECT id, conversationId FROM (
       SELECT id, conversationId, ROW_NUMBER() OVER (PARTITION BY conversationId ORDER BY createdAt DESC) as rn
       FROM DirectMessages
       WHERE conversationId IN (:conversationIds)
     ) sub WHERE rn = 1`,
    { replacements: { conversationIds }, type: QueryTypes.SELECT },
  );

  if (latestMessageRows.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  // Step 3: Fetch full latest messages with sender info
  const latestMessages = await DirectMessage.scope("withSender").findAll({
    where: { id: { [Op.in]: latestMessageRows.map((r) => r.id) } },
  });

  // Step 4: Get unread status per conversation (batch)
  const unreadRows = await sequelize.query<{ conversationId: string; unreadCount: number }>(
    `SELECT conversationId, COUNT(*) as unreadCount FROM DirectMessages
     WHERE conversationId IN (:conversationIds)
     AND senderId != :userId
     AND isRead = 0
     GROUP BY conversationId`,
    { replacements: { conversationIds, userId }, type: QueryTypes.SELECT },
  );

  const latestMessageMap = new Map(latestMessages.map((m) => [m.conversationId, m]));
  const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, true]));

  // Build response: only include conversations that have messages
  const sorted = conversations
    .filter((c) => latestMessageMap.has(c.id))
    .map((c) => {
      const latestMessage = latestMessageMap.get(c.id)!;
      return {
        ...c.toJSON(),
        messages: [latestMessage],
        hasUnread: unreadMap.get(c.id) ?? false,
      };
    })
    .sort((a, b) => {
      const aTime = new Date(a.messages[0]!.createdAt).getTime();
      const bTime = new Date(b.messages[0]!.createdAt).getTime();
      return bTime - aTime;
    });

  return res.status(200).type("application/json").send(sorted);
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
  const fullConversation = await DirectMessageConversation.scope(["withParticipants", "withMessages"]).findByPk(conversation.id);

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

  const conversation = await DirectMessageConversation.scope(["withParticipants", "withMessages"]).findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(conversation);
});

directMessageRouter.ws("/dm/:conversationId", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
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

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
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
  const fullMessage = await DirectMessage.scope("withSender").findByPk(message.id);

  return res.status(201).type("application/json").send(fullMessage);
});

directMessageRouter.post("/dm/:conversationId/read", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
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
