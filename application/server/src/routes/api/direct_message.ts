import { Router } from "express";
import httpErrors from "http-errors";
import { col, where, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();

function serializeDirectMessage(message: {
  id: string;
  body: string;
  createdAt: Date | string;
  isRead: boolean;
  senderId: string;
  updatedAt?: Date | string;
}) {
  return {
    id: message.id,
    sender: {
      id: message.senderId,
    },
    body: message.body,
    isRead: message.isRead,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt ?? message.createdAt,
  };
}

function buildConversationIncludes() {
  return [
    {
      association: "initiator" as const,
      include: [{ association: "profileImage" as const }],
    },
    {
      association: "member" as const,
      include: [{ association: "profileImage" as const }],
    },
  ];
}

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.unscoped().findAll({
    where: {
      [Op.and]: [
        { [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }] },
        where(col("messages.id"), { [Op.not]: null }),
      ],
    },
    include: [
      ...buildConversationIncludes(),
      {
        association: "messages",
        attributes: ["id", "body", "createdAt", "isRead", "senderId"],
        order: [["createdAt", "ASC"]],
        required: true,
      },
    ],
    order: [[col("messages.createdAt"), "DESC"]],
  });

  const sorted = conversations.map((conversation) => {
    const serialized = conversation.toJSON() as Record<string, unknown> & {
      id: string;
      initiator?: { id: string; profileImage?: unknown };
      member?: { id: string; profileImage?: unknown };
      messages?: Array<{ id: string; body: string; createdAt: string; isRead: boolean; senderId: string }>;
    };
    const peer =
      serialized.initiator?.id !== req.session.userId ? serialized.initiator : serialized.member;
    const lastMessage = serialized.messages?.at(-1) ?? null;
    const hasUnread =
      peer != null
        ? serialized.messages?.some((message) => message.senderId === peer.id && !message.isRead) ===
          true
        : false;

    return {
      id: serialized.id,
      initiator: serialized.initiator,
      member: serialized.member,
      lastMessage,
      hasUnread,
    };
  });

  return res.status(200).type("application/json").send(sorted);
});

directMessageRouter.post("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const peer = await User.findByPk(req.body?.peerId, {
    attributes: ["id"],
  });
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

  return res.status(200).type("application/json").send({ id: conversation.id });
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
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
    include: [
      ...buildConversationIncludes(),
      {
        association: "messages",
        attributes: ["id", "body", "createdAt", "isRead", "senderId"],
        order: [["createdAt", "ASC"]],
        required: false,
      },
    ],
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const serialized = conversation.toJSON() as Record<string, unknown> & {
    messages?: Array<{
      id: string;
      body: string;
      createdAt: string;
      isRead: boolean;
      senderId: string;
      updatedAt?: string;
    }>;
  };

  return res.status(200).type("application/json").send({
    ...serialized,
    messages: serialized.messages?.map(serializeDirectMessage) ?? [],
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

  return res.status(201).type("application/json").send(
    serializeDirectMessage({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      isRead: message.isRead,
      senderId: message.senderId,
      updatedAt: message.updatedAt,
    }),
  );
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
