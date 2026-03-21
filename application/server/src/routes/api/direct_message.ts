import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

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

  const conversations = await DirectMessageConversation.unscoped().findAll({
    where: {
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
    attributes: ["id", "initiatorId", "memberId"],
    include: [
      {
        association: "initiator",
        attributes: ["id", "name", "username"],
        include: [{ association: "profileImage", attributes: ["id", "alt"] }],
      },
      {
        association: "member",
        attributes: ["id", "name", "username"],
        include: [{ association: "profileImage", attributes: ["id", "alt"] }],
      },
    ],
  });

  const results = await Promise.all(
    conversations.map(async (c) => {
      const lastMessage = await DirectMessage.unscoped().findOne({
        where: { conversationId: c.id },
        attributes: ["body", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 1,
      });

      if (lastMessage == null) {
        return null;
      }

      const peer = c.initiatorId !== userId ? c.initiator : c.member;
      const peerId = c.initiatorId !== userId ? c.initiatorId : c.memberId;
      const hasUnread =
        (await DirectMessage.unscoped().count({
          where: { conversationId: c.id, senderId: peerId, isRead: false },
        })) > 0;

      return {
        id: c.id,
        peer: peer?.toJSON(),
        lastMessage: lastMessage.toJSON(),
        hasUnread,
      };
    }),
  );

  const sorted = results
    .filter((r): r is NonNullable<typeof r> => r != null)
    .sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
    );

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
  await conversation.reload({
    include: [
      {
        association: "messages",
        include: [{ association: "sender", include: [{ association: "profileImage" }] }],
        order: [["createdAt", "ASC"]],
        required: false,
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

  const MESSAGE_LIMIT = 30;

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const before = typeof req.query["before"] === "string" ? req.query["before"] : undefined;

  const whereClause: Record<string, unknown> = { conversationId: conversation.id };
  if (before != null) {
    const cursorMessage = await DirectMessage.findByPk(before, { attributes: ["createdAt"] });
    if (cursorMessage != null) {
      whereClause["createdAt"] = { [Op.lt]: cursorMessage.createdAt };
    }
  }

  const allMessages = await DirectMessage.findAll({
    where: whereClause,
    include: [{ association: "sender", include: [{ association: "profileImage" }] }],
    order: [["createdAt", "ASC"]],
  });

  const hasMore = allMessages.length > MESSAGE_LIMIT;
  const messages = hasMore ? allMessages.slice(allMessages.length - MESSAGE_LIMIT) : allMessages;

  const json = conversation.toJSON();
  return res
    .status(200)
    .type("application/json")
    .send({
      ...json,
      // Sequelizeモデルを事前にプレーン化してJSON.stringifyのコストを削減
      messages: messages.map((m) => m.toJSON()),
      hasMore,
    });
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
