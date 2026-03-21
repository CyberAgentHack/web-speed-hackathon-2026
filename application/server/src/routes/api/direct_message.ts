import { Router } from "express";
import httpErrors from "http-errors";
import { col, where, Op, QueryTypes } from "sequelize";

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

  const userId = req.session.userId!;
  const sequelize = DirectMessageConversation.sequelize!;
  const msgTable = DirectMessage.getTableName() as string;

  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });

  if (conversations.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const convIds = conversations.map((c) => c.id);

  const lastMsgRows = await sequelize.query<{ id: string; conversationId: string }>(
    `SELECT dm.id, dm.conversationId FROM "${msgTable}" dm
     INNER JOIN (
       SELECT conversationId, MAX(createdAt) as maxCreated
       FROM "${msgTable}" WHERE conversationId IN (:convIds)
       GROUP BY conversationId
     ) latest ON dm.conversationId = latest.conversationId AND dm.createdAt = latest.maxCreated`,
    { replacements: { convIds }, type: QueryTypes.SELECT },
  );

  const lastMessages = await DirectMessage.findAll({
    where: { id: lastMsgRows.map((r) => r.id) },
  });

  const unreadRows = await sequelize.query<{ conversationId: string }>(
    `SELECT DISTINCT conversationId FROM "${msgTable}"
     WHERE conversationId IN (:convIds) AND senderId != :userId AND isRead = 0`,
    { replacements: { convIds, userId }, type: QueryTypes.SELECT },
  );
  const unreadSet = new Set(unreadRows.map((r) => r.conversationId));

  const msgByConv = new Map<string, object>();
  for (const msg of lastMessages) {
    msgByConv.set(msg.conversationId, msg.toJSON());
  }

  const sorted = conversations
    .filter((c) => msgByConv.has(c.id))
    .sort((a, b) => {
      const msgA = msgByConv.get(a.id) as { createdAt: string };
      const msgB = msgByConv.get(b.id) as { createdAt: string };
      return new Date(msgB.createdAt).getTime() - new Date(msgA.createdAt).getTime();
    })
    .map((c) => ({
      ...c.toJSON(),
      messages: [msgByConv.get(c.id)!],
      hasUnread: unreadSet.has(c.id),
    }));

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

  const [conv] = await DirectMessageConversation.unscoped().findOrCreate({
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

  const conversation = await DirectMessageConversation.scope("withMessages").findByPk(conv.id);

  return res.status(200).type("application/json").send(conversation);
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

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const result = conversation.toJSON() as Record<string, unknown>;
  result.messages = [];
  return res.status(200).type("application/json").send(result);
});

directMessageRouter.get("/dm/:conversationId/messages", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : 30;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : 0;

  const messages = await DirectMessage.unscoped().findAll({
    where: { conversationId: conversation.id },
    include: [{ association: "sender", include: [{ association: "profileImage" }] }],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return res.status(200).type("application/json").send(messages.reverse());
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
  await message.reload();

  return res.status(201).type("application/json").send(message);
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
