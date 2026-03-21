import { Router } from "express";
import httpErrors from "http-errors";
import { QueryTypes, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  countUnreadDirectMessagesForUser,
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });

  if (conversations.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const placeholders = conversationIds.map(() => "?").join(", ");

  // Load only the newest message per conversation to keep the DM list light.
  const latestMessageRows = await DirectMessage.sequelize!.query<{
    conversationId: string;
    id: string;
  }>(
    `
      SELECT ranked.id, ranked.conversationId
      FROM (
        SELECT
          "id",
          "conversationId",
          ROW_NUMBER() OVER (
            PARTITION BY "conversationId"
            ORDER BY "createdAt" DESC, "id" DESC
          ) AS "rowNumber"
        FROM "DirectMessages"
        WHERE "conversationId" IN (${placeholders})
      ) AS ranked
      WHERE ranked."rowNumber" = 1
    `,
    {
      replacements: conversationIds,
      type: QueryTypes.SELECT,
    },
  );

  const latestMessages = await DirectMessage.unscoped().findAll({
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
  const latestMessagesByConversationId = new Map(
    latestMessages.map((message) => [message.conversationId, message]),
  );

  const unreadConversationRows = await DirectMessage.unscoped().findAll({
    attributes: ["conversationId"],
    group: ["conversationId"],
    raw: true,
    where: {
      conversationId: conversationIds,
      isRead: false,
      senderId: { [Op.ne]: req.session.userId },
    },
  });
  const unreadConversationIds = new Set(
    unreadConversationRows.map((row) => row.conversationId as string),
  );

  const sorted = conversations
    .map((conversation) => {
      const latestMessage = latestMessagesByConversationId.get(conversation.id);
      if (latestMessage == null) {
        return null;
      }

      return {
        ...conversation.toJSON(),
        hasUnread: unreadConversationIds.has(conversation.id),
        messages: [latestMessage.toJSON()],
      };
    })
    .filter((conversation) => conversation != null)
    .sort((a, b) => {
      const aLastMessage = a.messages.at(-1);
      const bLastMessage = b.messages.at(-1);

      return (
        new Date(bLastMessage?.createdAt ?? 0).getTime() -
        new Date(aLastMessage?.createdAt ?? 0).getTime()
      );
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

  const unreadCount = await countUnreadDirectMessagesForUser(req.session.userId);

  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    include: [
      {
        association: "messages",
        include: [{ association: "sender", include: [{ association: "profileImage" }] }],
        order: [["createdAt", "ASC"]],
        required: false,
        separate: true,
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

  const [updatedCount] = await DirectMessage.update(
    { isRead: true },
    {
      where: { conversationId: conversation.id, senderId: peerId, isRead: false },
    },
  );

  if (updatedCount > 0) {
    const unreadCount = await countUnreadDirectMessagesForUser(req.session.userId);
    const latestPeerMessage = await DirectMessage.unscoped().findOne({
      attributes: ["id", "body", "senderId", "conversationId", "isRead", "createdAt", "updatedAt"],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      where: {
        conversationId: conversation.id,
        senderId: peerId,
      },
    });

    if (latestPeerMessage != null) {
      eventhub.emit(`dm:conversation/${conversation.id}:message`, latestPeerMessage.toJSON());
    }
    eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
  }

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
