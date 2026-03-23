import { Router } from "express";
import httpErrors from "http-errors";
import { literal, Op, QueryTypes } from "sequelize";

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

  const sequelize = DirectMessage.sequelize!;
  // SQLite 用の識別子クォート（Sequelize インスタンスの quoteIdentifier は型定義に無いためローカルで行う）
  const dmTable = `"${DirectMessage.tableName}"`;
  const convTable = `"${DirectMessageConversation.tableName}"`;

  // メッセージが1件以上ある会話のみ（messages を全件ロードしない）
  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.and]: [
        { [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }] },
        literal(`EXISTS (SELECT 1 FROM ${dmTable} AS dm WHERE dm.conversationId = ${convTable}.id)`),
      ],
    },
  });

  if (conversations.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const conversationIds = conversations.map((c) => c.id);

  // 各会話の最新メッセージを1クエリで取得（createdAt 同率は id 降順）
  const placeholders = conversationIds.map(() => "?").join(",");
  const rawLatest = await sequelize.query<{ id: string }>(
    `SELECT ranked.id AS id FROM (
      SELECT id,
        ROW_NUMBER() OVER (PARTITION BY conversationId ORDER BY datetime(createdAt) DESC, id DESC) AS rn
      FROM ${dmTable}
      WHERE conversationId IN (${placeholders})
    ) AS ranked WHERE ranked.rn = 1`,
    { replacements: conversationIds, type: QueryTypes.SELECT },
  );

  const latestMessageIds = rawLatest.map((r) => r.id);
  if (latestMessageIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const latestMessages = await DirectMessage.findAll({
    where: { id: { [Op.in]: latestMessageIds } },
    include: [{ association: "sender", include: [{ association: "profileImage" }] }],
  });

  // 相手からの未読がある会話IDを一括取得
  const unreadRows = await DirectMessage.findAll({
    attributes: ["conversationId"],
    where: {
      conversationId: { [Op.in]: conversationIds },
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    group: ["conversationId"],
  });
  const unreadConversationIds = new Set(unreadRows.map((dm) => dm.conversationId));

  const latestMessageByConversation = new Map(latestMessages.map((m) => [m.conversationId, m]));

  const sorted = conversations
    .filter((c) => latestMessageByConversation.has(c.id))
    .sort((a, b) => {
      const aTime = new Date(latestMessageByConversation.get(a.id)!.createdAt).getTime();
      const bTime = new Date(latestMessageByConversation.get(b.id)!.createdAt).getTime();
      return bTime - aTime;
    })
    .map((c) => ({
      ...c.toJSON(),
      latestMessage: latestMessageByConversation.get(c.id)?.toJSON() ?? null,
      hasUnread: unreadConversationIds.has(c.id),
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
    include: [
      {
        association: "messages",
        include: [{ association: "sender", include: [{ association: "profileImage" }] }],
        required: false,
        separate: true,
        order: [["createdAt", "ASC"]],
      },
    ],
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
