import { Router } from "express";
import httpErrors from "http-errors";
import { and, eq, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { getDb } from "@web-speed-hackathon-2026/server/src/db/client";
import * as schema from "@web-speed-hackathon-2026/server/src/db/schema";
import {
  countUnreadMessages,
  findConversationByPk,
  findConversationForUser,
  findConversationsForUser,
  findDmByPk,
  findUserByPk,
} from "@web-speed-hackathon-2026/server/src/db/queries";
import { emitDmEvents } from "@web-speed-hackathon-2026/server/src/db/hooks";
import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";

export const directMessageRouter = Router();

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await findConversationsForUser(getDb(), req.session.userId);

  return res.status(200).type("application/json").send(conversations);
});

directMessageRouter.post("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const db = getDb();
  const peer = await findUserByPk(db, req.body?.peerId);
  if (!peer) {
    throw new httpErrors.NotFound();
  }

  // findOrCreate
  let conversation = await db.query.directMessageConversations.findFirst({
    where: or(
      and(
        eq(schema.directMessageConversations.initiatorId, req.session.userId),
        eq(schema.directMessageConversations.memberId, peer.id),
      ),
      and(
        eq(schema.directMessageConversations.initiatorId, peer.id),
        eq(schema.directMessageConversations.memberId, req.session.userId),
      ),
    ),
  });

  if (!conversation) {
    const now = new Date().toISOString();
    const id = uuidv4();
    await db.insert(schema.directMessageConversations).values({
      id,
      initiatorId: req.session.userId,
      memberId: peer.id,
      createdAt: now,
      updatedAt: now,
    });
    conversation = await db.query.directMessageConversations.findFirst({
      where: eq(schema.directMessageConversations.id, id),
    });
  }

  // reload with full relations
  const full = await findConversationByPk(db, conversation!.id);

  return res.status(200).type("application/json").send(full);
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

  const unreadCount = await countUnreadMessages(getDb(), req.session.userId);

  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationForUser(getDb(), req.params.conversationId, req.session.userId);
  if (!conversation) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(conversation);
});

directMessageRouter.ws("/dm/:conversationId", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationForUser(getDb(), req.params.conversationId, req.session.userId);
  if (!conversation) {
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

  const db = getDb();
  const conversation = await findConversationForUser(db, req.params.conversationId, req.session.userId);
  if (!conversation) {
    throw new httpErrors.NotFound();
  }

  const now = new Date().toISOString();
  const messageId = uuidv4();
  await db.insert(schema.directMessages).values({
    id: messageId,
    body: body.trim(),
    conversationId: conversation.id,
    senderId: req.session.userId,
    createdAt: now,
    updatedAt: now,
  });

  // Emit hook events
  await emitDmEvents(db, messageId);

  const message = await findDmByPk(db, messageId);
  return res.status(201).type("application/json").send(message);
});

directMessageRouter.post("/dm/:conversationId/read", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const db = getDb();
  const conversation = await findConversationForUser(db, req.params.conversationId, req.session.userId);
  if (!conversation) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== req.session.userId
      ? conversation.initiatorId
      : conversation.memberId;

  // Get unread message IDs before updating (for hook emits)
  const unreadMessages = await db.query.directMessages.findMany({
    where: and(
      eq(schema.directMessages.conversationId, conversation.id),
      eq(schema.directMessages.senderId, peerId),
      eq(schema.directMessages.isRead, 0),
    ),
    columns: { id: true as const },
  });

  if (unreadMessages.length > 0) {
    const now = new Date().toISOString();
    await db
      .update(schema.directMessages)
      .set({ isRead: 1, updatedAt: now })
      .where(
        and(
          eq(schema.directMessages.conversationId, conversation.id),
          eq(schema.directMessages.senderId, peerId),
          eq(schema.directMessages.isRead, 0),
        ),
      );

    // Emit events for each updated message
    for (const msg of unreadMessages) {
      await emitDmEvents(db, msg.id);
    }
  }

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await findConversationByPk(getDb(), req.params.conversationId);
  if (!conversation) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
