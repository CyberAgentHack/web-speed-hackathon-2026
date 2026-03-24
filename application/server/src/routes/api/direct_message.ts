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

function getTableName(model: typeof DirectMessage | typeof DirectMessageConversation) {
  const tableName = model.getTableName();
  return typeof tableName === "string" ? tableName : tableName.tableName;
}

function quoteTableName(tableName: string) {
  return `"${tableName.replaceAll('"', '""')}"`;
}

async function findConversationForUser(conversationId: string, userId: string) {
  return DirectMessageConversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
}

async function getUnreadCount(userId: string) {
  return DirectMessage.count({
    distinct: true,
    where: {
      senderId: { [Op.ne]: userId },
      isRead: false,
    },
    include: [
      {
        association: "conversation",
        where: {
          [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
        },
        required: true,
      },
    ],
  });
}

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.unscoped().findAll({
    include: [
      {
        association: "initiator",
        attributes: { exclude: ["profileImageId"] },
        include: [{ association: "profileImage" }],
      },
      {
        association: "member",
        attributes: { exclude: ["profileImageId"] },
        include: [{ association: "profileImage" }],
      },
    ],
    where: {
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });

  const conversationIds = conversations.map((conversation) => conversation.id);
  const sequelize = DirectMessage.sequelize;
  if (sequelize == null) {
    throw new Error("Sequelize is not initialized");
  }

  const directMessagesTableName = quoteTableName(getTableName(DirectMessage));

  const latestMessageRows =
    conversationIds.length === 0
      ? []
      : await sequelize.query<{ id: string; conversationId: string }>(
          `
            SELECT ranked.id, ranked.conversationId
            FROM (
              SELECT
                id,
                conversationId,
                ROW_NUMBER() OVER (
                  PARTITION BY conversationId
                  ORDER BY createdAt DESC, id DESC
                ) AS row_number
              FROM ${directMessagesTableName}
              WHERE conversationId IN (:conversationIds)
            ) AS ranked
            WHERE ranked.row_number = 1
          `,
          {
            replacements: { conversationIds },
            type: QueryTypes.SELECT,
          },
        );

  const latestMessages =
    latestMessageRows.length === 0
      ? []
      : await DirectMessage.unscoped().findAll({
          include: [
            {
              association: "sender",
              include: [{ association: "profileImage" }],
            },
          ],
          where: {
            id: latestMessageRows.map((row) => row.id),
          },
        });

  const latestMessageByConversationId = new Map(
    latestMessageRows.map((row) => [
      row.conversationId,
      latestMessages.find((message) => message.id === row.id) ?? null,
    ]),
  );

  const unreadCountRows =
    conversationIds.length === 0
      ? []
      : await sequelize.query<{ conversationId: string; unreadCount: number }>(
          `
            SELECT
              conversationId,
              COUNT(*) AS unreadCount
            FROM ${directMessagesTableName}
            WHERE
              conversationId IN (:conversationIds)
              AND senderId != :userId
              AND isRead = 0
            GROUP BY conversationId
          `,
          {
            replacements: {
              conversationIds,
              userId: req.session.userId,
            },
            type: QueryTypes.SELECT,
          },
        );

  const unreadCountByConversationId = new Map(
    unreadCountRows.map((row) => [row.conversationId, Number(row.unreadCount)]),
  );

  const response = conversations
    .map((conversation) => {
      const latestMessage = latestMessageByConversationId.get(conversation.id) ?? null;
      return {
        ...conversation.toJSON(),
        latestMessage,
        messages: latestMessage == null ? [] : [latestMessage],
        unreadCount: unreadCountByConversationId.get(conversation.id) ?? 0,
      };
    })
    .sort((a, b) => {
      const aTime = a.latestMessage == null ? 0 : new Date(a.latestMessage.createdAt).getTime();
      const bTime = b.latestMessage == null ? 0 : new Date(b.latestMessage.createdAt).getTime();
      return bTime - aTime;
    });

  return res.status(200).type("application/json").send(response);
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

  await conversation.reload({
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
      {
        association: "messages",
        include: [{ association: "sender", include: [{ association: "profileImage" }] }],
      },
    ],
  });

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

  const unreadCount = await getUnreadCount(req.session.userId);
  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationForUser(req.params.conversationId, req.session.userId);
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(conversation);
});

directMessageRouter.ws("/dm/:conversationId", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationForUser(req.params.conversationId, req.session.userId);
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

  const handleReadUpdated = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:read", payload }));
  };
  eventhub.on(`dm:conversation/${conversation.id}:read`, handleReadUpdated);
  req.ws.on("close", () => {
    eventhub.off(`dm:conversation/${conversation.id}:read`, handleReadUpdated);
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

  const conversation = await findConversationForUser(req.params.conversationId, req.session.userId);
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

  const conversation = await findConversationForUser(req.params.conversationId, req.session.userId);
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== req.session.userId
      ? conversation.initiatorId
      : conversation.memberId;

  const [updatedCount] = await DirectMessage.update(
    { isRead: true },
    {
      where: { conversationId: conversation.id, senderId: peerId, isRead: false },
    },
  );

  if (updatedCount > 0) {
    const unreadCount = await getUnreadCount(req.session.userId);
    eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
    eventhub.emit(`dm:conversation/${conversation.id}:read`, {
      readerId: req.session.userId,
    });
  }

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationForUser(req.params.conversationId, req.session.userId);
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
