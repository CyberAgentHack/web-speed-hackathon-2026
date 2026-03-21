import { Router } from "express";
import httpErrors from "http-errors";
import { literal, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();

function sanitizeDmMessagePayload(payload: unknown): unknown {
  const normalizedPayload = typeof payload === "object" &&
      payload !== null &&
      "toJSON" in payload &&
      typeof payload.toJSON === "function"
    ? payload.toJSON()
    : payload;

  if (typeof normalizedPayload !== "object" || normalizedPayload === null) {
    return normalizedPayload;
  }

  const payloadRecord = normalizedPayload as Record<string, unknown>;
  const senderPayload = payloadRecord["sender"];
  const normalizedSender = typeof senderPayload === "object" &&
      senderPayload !== null &&
      "toJSON" in senderPayload &&
      typeof senderPayload.toJSON === "function"
    ? senderPayload.toJSON()
    : senderPayload;

  if (typeof normalizedSender !== "object" || normalizedSender === null) {
    return payloadRecord;
  }

  const senderRecord = normalizedSender as Record<string, unknown>;
  return {
    ...payloadRecord,
    sender: {
      id: senderRecord["id"],
    },
  };
}

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.unscoped().findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ initiatorId: req.session.userId }, {
            memberId: req.session.userId,
          }],
        },
        literal(
          `EXISTS (SELECT 1 FROM "DirectMessages" WHERE "DirectMessages"."conversationId" = "DirectMessageConversation"."id")`,
        ),
      ],
    },
    include: [
      {
        association: "initiator",
        include: [{ association: "profileImage" }],
      },
      {
        association: "member",
        include: [{ association: "profileImage" }],
      },
      {
        association: "messages",
        attributes: ["body", "isRead", "createdAt", "senderId"],
        order: [["createdAt", "DESC"]],
        limit: 1,
        separate: true,
        required: false,
      },
    ],
    order: [
      [
        literal(
          '(SELECT MAX("createdAt") FROM "DirectMessages" WHERE "DirectMessages"."conversationId" = "DirectMessageConversation"."id")',
        ),
        "DESC",
      ],
    ],
  });

  const responseConversations = conversations.map((conversation) => {
    const json = conversation.toJSON() as {
      messages?: Array<{
        senderId?: string;
        body: string;
        isRead: boolean;
        createdAt: string;
      }>;
    } & Record<string, unknown>;
    const lastMessage = json.messages?.[0];
    const hasUnread = lastMessage != null &&
      lastMessage.senderId !== req.session.userId &&
      lastMessage.isRead === false;

    return {
      ...json,
      hasUnread,
      messages: (json.messages ?? []).map((message) => ({
        body: message.body,
        isRead: message.isRead,
        createdAt: message.createdAt,
      })),
    };
  });

  return res.status(200).type("application/json").send(responseConversations);
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
          [Op.or]: [{ initiatorId: req.session.userId }, {
            memberId: req.session.userId,
          }],
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
      [Op.or]: [{ initiatorId: req.session.userId }, {
        memberId: req.session.userId,
      }],
    },
    include: [
      {
        association: "initiator",
        include: [{ association: "profileImage" }],
      },
      {
        association: "member",
        include: [{ association: "profileImage" }],
      },
      {
        association: "messages",
        attributes: ["id", "body", "isRead", "createdAt"],
        include: [{
          model: User.unscoped(),
          association: "sender",
          attributes: ["id"],
          include: [{ association: "profileImage", attributes: [] }],
        }],
        order: [["createdAt", "ASC"]],
        required: false,
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
      [Op.or]: [{ initiatorId: req.session.userId }, {
        memberId: req.session.userId,
      }],
    },
  });
  if (conversation == null) {
    throw new httpErrors.NotFound();
  }

  const peerId = conversation.initiatorId !== req.session.userId
    ? conversation.initiatorId
    : conversation.memberId;

  const handleMessageUpdated = (payload: unknown) => {
    req.ws.send(JSON.stringify({
      type: "dm:conversation:message",
      payload: sanitizeDmMessagePayload(payload),
    }));
  };
  eventhub.on(
    `dm:conversation/${conversation.id}:message`,
    handleMessageUpdated,
  );
  req.ws.on("close", () => {
    eventhub.off(
      `dm:conversation/${conversation.id}:message`,
      handleMessageUpdated,
    );
  });

  const handleTyping = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
  };
  eventhub.on(
    `dm:conversation/${conversation.id}:typing/${peerId}`,
    handleTyping,
  );
  req.ws.on("close", () => {
    eventhub.off(
      `dm:conversation/${conversation.id}:typing/${peerId}`,
      handleTyping,
    );
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
      [Op.or]: [{ initiatorId: req.session.userId }, {
        memberId: req.session.userId,
      }],
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
  const responseMessage = await DirectMessage.unscoped().findByPk(message.id, {
    attributes: ["id", "body", "isRead", "createdAt", "updatedAt", "senderId"],
    include: [{
      association: "sender",
      attributes: ["id"],
    }],
  });

  return res.status(201).type("application/json").send(
    responseMessage ?? message,
  );
});

directMessageRouter.post("/dm/:conversationId/read", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, {
        memberId: req.session.userId,
      }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const peerId = conversation.initiatorId !== req.session.userId
    ? conversation.initiatorId
    : conversation.memberId;

  await DirectMessage.update(
    { isRead: true },
    {
      where: {
        conversationId: conversation.id,
        senderId: peerId,
        isRead: false,
      },
      individualHooks: true,
    },
  );

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findByPk(
    req.params.conversationId,
  );
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(
    `dm:conversation/${conversation.id}:typing/${req.session.userId}`,
    {},
  );

  return res.status(200).type("application/json").send({});
});
