import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import { getSequelize } from "@web-speed-hackathon-2026/server/src/sequelize";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();

async function findConversationIdsByUserId(userId: string) {
  const conversations = await DirectMessageConversation.unscoped().findAll({
    attributes: ["id"],
    raw: true,
    where: {
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });

  return conversations.map((conversation) => conversation.id);
}

type LatestMessageRow = {
  body: string;
  conversationId: string;
  createdAt: string;
  id: string;
  isRead: number;
  senderId: string;
  updatedAt: string;
};

type UnreadRow = {
  conversationId: string;
  unreadCount: number;
};

async function findLatestMessagesByConversationIds(conversationIds: string[]) {
  if (conversationIds.length === 0) {
    return new Map<string, LatestMessageRow>();
  }

  const sequelize = getSequelize();
  const placeholders = conversationIds.map(() => "?").join(", ");
  const rows = (await sequelize.query(
    `
      SELECT id, conversationId, senderId, body, isRead, createdAt, updatedAt
      FROM (
        SELECT
          id,
          conversationId,
          senderId,
          body,
          isRead,
          createdAt,
          updatedAt,
          ROW_NUMBER() OVER (
            PARTITION BY conversationId
            ORDER BY createdAt DESC, id DESC
          ) AS rowNumber
        FROM DirectMessages
        WHERE conversationId IN (${placeholders})
      )
      WHERE rowNumber = 1
    `,
    {
      raw: true,
      replacements: conversationIds,
      type: "SELECT",
    },
  )) as LatestMessageRow[];

  return new Map(rows.map((row) => [row.conversationId, row]));
}

async function findUnreadConversationIds(conversationIds: string[], userId: string) {
  if (conversationIds.length === 0) {
    return new Set<string>();
  }

  const sequelize = getSequelize();
  const placeholders = conversationIds.map(() => "?").join(", ");
  const rows = (await sequelize.query(
    `
      SELECT conversationId, COUNT(*) AS unreadCount
      FROM DirectMessages
      WHERE
        conversationId IN (${placeholders})
        AND isRead = 0
        AND senderId != ?
      GROUP BY conversationId
    `,
    {
      raw: true,
      replacements: [...conversationIds, userId],
      type: "SELECT",
    },
  )) as UnreadRow[];

  return new Set(rows.map((row) => row.conversationId));
}

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.unscoped().findAll({
    attributes: ["id", "initiatorId", "memberId"],
    where: {
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
    ],
  });

  const conversationIds = conversations.map((conversation) => conversation.id);
  if (conversationIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const [latestMessages, unreadConversationIds] = await Promise.all([
    findLatestMessagesByConversationIds(conversationIds),
    findUnreadConversationIds(conversationIds, req.session.userId),
  ]);

  const sorted = conversations
    .map((conversation) => {
      const lastMessage = latestMessages.get(conversation.id);
      if (lastMessage == null) {
        return null;
      }

      return {
        ...conversation.toJSON(),
        hasUnread: unreadConversationIds.has(conversation.id),
        lastMessage: {
          ...lastMessage,
          isRead: Boolean(lastMessage.isRead),
        },
      };
    })
    .filter((conversation) => conversation !== null)
    .sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
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

  const conversationIds = await findConversationIdsByUserId(req.session.userId);
  const unreadCount =
    conversationIds.length === 0
      ? 0
      : await DirectMessage.unscoped().count({
          where: {
            conversationId: conversationIds,
            isRead: false,
            senderId: { [Op.ne]: req.session.userId },
          },
        });

  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
    ],
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const messages = await DirectMessage.findAll({
    where: {
      conversationId: conversation.id,
    },
    order: [["createdAt", "ASC"]],
  });

  return res
    .status(200)
    .type("application/json")
    .send({ ...conversation.toJSON(), messages: messages.map((message) => message.toJSON()) });
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
