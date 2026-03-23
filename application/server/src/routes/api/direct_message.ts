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

  const conversations = await DirectMessageConversation.unscoped().findAll({
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
    ],
    where: {
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });

  const conversationIds = conversations.map((c) => c.id);
  if (conversationIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  // Fetch the latest message ID per conversation via raw SQL subquery
  const sequelize = DirectMessage.sequelize!;
  const latestMsgRows = await sequelize.query<{
    id: string;
    conversationId: string;
    createdAt: string;
  }>(
    `SELECT dm.id, dm.conversationId, dm.createdAt
     FROM DirectMessages dm
     INNER JOIN (
       SELECT conversationId, MAX(createdAt) AS maxCreatedAt
       FROM DirectMessages
       WHERE conversationId IN (:convIds)
       GROUP BY conversationId
     ) latest ON dm.conversationId = latest.conversationId AND dm.createdAt = latest.maxCreatedAt
     WHERE dm.conversationId IN (:convIds)`,
    {
      replacements: { convIds: conversationIds },
      type: QueryTypes.SELECT,
    },
  );

  // Fetch full message objects for those IDs
  const latestMsgIds = latestMsgRows.map((r) => r.id);
  const latestMessages =
    latestMsgIds.length > 0
      ? await DirectMessage.unscoped().findAll({
          where: { id: { [Op.in]: latestMsgIds } },
          include: [{ association: "sender", include: [{ association: "profileImage" }] }],
        })
      : [];

  const msgByConv = new Map<string, (typeof latestMessages)[number]>();
  for (const msg of latestMessages) {
    msgByConv.set(msg.conversationId, msg);
  }

  // Query unread conversation IDs in bulk
  const unreadRows = await DirectMessage.unscoped().findAll({
    attributes: ["conversationId"],
    where: {
      conversationId: { [Op.in]: conversationIds },
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    group: ["conversationId"],
  });
  const unreadSet = new Set(unreadRows.map((r) => r.conversationId));

  // Filter out conversations with no messages, then sort by latest message
  const sorted = conversations
    .filter((c) => msgByConv.has(c.id))
    .map((c) => {
      const latestMsg = msgByConv.get(c.id)!;
      return {
        ...c.toJSON(),
        messages: [latestMsg],
        hasUnread: unreadSet.has(c.id),
      };
    })
    .sort((a, b) => {
      const aLast = a.messages[0];
      const bLast = b.messages[0];
      return new Date(bLast?.createdAt ?? 0).getTime() - new Date(aLast?.createdAt ?? 0).getTime();
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

  const [conversation] = await DirectMessageConversation.unscoped().findOrCreate({
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

  const result = await DirectMessageConversation.unscoped().findByPk(conversation.id, {
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
    ],
  });

  return res
    .status(200)
    .type("application/json")
    .send({ ...result!.toJSON(), messages: [] });
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

  const conversation = await DirectMessageConversation.unscoped().findOne({
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
      {
        association: "messages",
        include: [{ association: "sender", include: [{ association: "profileImage" }] }],
        separate: true,
        order: [["createdAt", "ASC"]],
      },
    ],
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

  const conversation = await DirectMessageConversation.unscoped().findOne({
    attributes: ["id", "initiatorId", "memberId"],
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

  const conversation = await DirectMessageConversation.unscoped().findOne({
    attributes: ["id", "initiatorId", "memberId"],
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

  const conversation = await DirectMessageConversation.unscoped().findOne({
    attributes: ["id", "initiatorId", "memberId"],
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
    },
  );

  // Emit unread count update once (replaces per-row individualHooks)
  const unreadCount = await DirectMessage.unscoped().count({
    where: {
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    include: [
      {
        association: "conversation",
        attributes: [],
        where: {
          [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
        },
        required: true,
      },
    ],
  });
  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findByPk(
    req.params.conversationId,
    {
      attributes: ["id", "initiatorId", "memberId"],
    },
  );
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
