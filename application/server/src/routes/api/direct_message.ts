import { Hono } from "hono";
import type { Context } from "hono";
import { col, where, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = new Hono();

directMessageRouter.get("/dm", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  const userId = session["userId"] as string | undefined;
  if (userId === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.and]: [
        { [Op.or]: [{ initiatorId: userId }, { memberId: userId }] },
        where(col("messages.id"), { [Op.not]: null }),
      ],
    },
    order: [[col("messages.createdAt"), "DESC"]],
  });

  const sorted = conversations.map((c) => ({
    ...c.toJSON(),
    messages: c.messages?.reverse(),
  }));

  return c.json(sorted, 200);
});

directMessageRouter.post("/dm", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  const userId = session["userId"] as string | undefined;
  if (userId === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const body = c.get("body" as never) || await c.req.json();
  const peer = await User.findByPk(body?.peerId);
  if (peer === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  const [conversation] = await DirectMessageConversation.findOrCreate({
    where: {
      [Op.or]: [
        { initiatorId: userId, memberId: peer.id },
        { initiatorId: peer.id, memberId: userId },
      ],
    },
    defaults: {
      initiatorId: userId,
      memberId: peer.id,
    },
  });
  await conversation.reload();

  return c.json(conversation, 200);
});

directMessageRouter.get("/dm/unread/ws", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  const userId = session["userId"] as string | undefined;
  if (userId === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const unreadCount = await DirectMessage.count({
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

  eventhub.emit(`dm:unread/${userId}`, { unreadCount });
  return c.json({ unreadCount }, 200);
});

directMessageRouter.get("/dm/:conversationId", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  const userId = session["userId"] as string | undefined;
  if (userId === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const conversationId = c.req.param("conversationId");
  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  return c.json(conversation, 200);
});

directMessageRouter.post("/dm/:conversationId/messages", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  const userId = session["userId"] as string | undefined;
  if (userId === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const body = c.get("body" as never) || await c.req.json();
  const messageBody: unknown = body?.body;
  if (typeof messageBody !== "string" || messageBody.trim().length === 0) {
    return c.json({ message: "Bad Request" }, 400);
  }

  const conversationId = c.req.param("conversationId");
  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  const message = await DirectMessage.create({
    body: messageBody.trim(),
    conversationId: conversation.id,
    senderId: userId,
  });
  await message.reload();

  eventhub.emit(`dm:conversation/${conversation.id}:message`, message);

  return c.json(message, 201);
});

directMessageRouter.post("/dm/:conversationId/read", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  const userId = session["userId"] as string | undefined;
  if (userId === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const conversationId = c.req.param("conversationId");
  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  const peerId =
    conversation.initiatorId !== userId
      ? conversation.initiatorId
      : conversation.memberId;

  await DirectMessage.update(
    { isRead: true },
    {
      where: { conversationId: conversation.id, senderId: peerId, isRead: false },
      individualHooks: true,
    },
  );

  return c.json({}, 200);
});

directMessageRouter.post("/dm/:conversationId/typing", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  const userId = session["userId"] as string | undefined;
  if (userId === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const conversationId = c.req.param("conversationId");
  const conversation = await DirectMessageConversation.findByPk(conversationId);
  if (conversation === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${userId}`, {});

  return c.json({}, 200);
});
