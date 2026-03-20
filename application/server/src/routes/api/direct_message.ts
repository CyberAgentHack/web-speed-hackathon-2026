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

  const messages = await DirectMessage.unscoped().findAll({
    attributes: ["id", "conversationId", "senderId", "body", "isRead", "createdAt", "updatedAt"],
    order: [["createdAt", "DESC"]],
    where: {
      conversationId: conversationIds,
    },
  });

  const conversationMetadata = new Map<
    string,
    {
      hasUnread: boolean;
      lastMessage: {
        body: string;
        createdAt: Date;
        id: string;
        isRead: boolean;
        senderId: string;
        updatedAt: Date;
      } | null;
    }
  >();

  for (const message of messages) {
    const current = conversationMetadata.get(message.conversationId) ?? {
      hasUnread: false,
      lastMessage: null,
    };
    if (current.lastMessage === null) {
      current.lastMessage = {
        body: message.body,
        createdAt: message.createdAt,
        id: message.id,
        isRead: message.isRead,
        senderId: message.senderId,
        updatedAt: message.updatedAt,
      };
    }
    if (message.senderId !== req.session.userId && !message.isRead) {
      current.hasUnread = true;
    }
    conversationMetadata.set(message.conversationId, current);
  }

  const sorted = conversations
    .map((conversation) => {
      const metadata = conversationMetadata.get(conversation.id);
      if (metadata?.lastMessage == null) {
        return null;
      }

      return {
        ...conversation.toJSON(),
        hasUnread: metadata.hasUnread,
        lastMessage: {
          ...metadata.lastMessage,
          createdAt: metadata.lastMessage.createdAt.toISOString(),
          updatedAt: metadata.lastMessage.updatedAt.toISOString(),
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
