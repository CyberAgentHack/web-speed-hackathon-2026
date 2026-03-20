import { and, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";

import { upgradeWebSocket } from "@web-speed-hackathon-2026/server/src/app";
import { getDb } from "@web-speed-hackathon-2026/server/src/db";
import {
  countUnreadMessages,
  emitDmNotifications,
  findConversationWithRelations,
  findConversations,
  findUserWithProfile,
} from "@web-speed-hackathon-2026/server/src/db/queries";
import {
  directMessageConversations,
  directMessages,
  users,
} from "@web-speed-hackathon-2026/server/src/db/schema";
import {
  serializeConversation,
  serializeDirectMessage,
} from "@web-speed-hackathon-2026/server/src/db/serializers";
import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type {
  DirectMessageConversationResponse,
  DirectMessageResponse,
} from "@web-speed-hackathon-2026/server/src/types/api";

export const directMessageRouter = new Hono<SessionEnv>()
  .get("/dm", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const conversations = await findConversations(userId);

    const filtered = conversations
      .filter((conv) => conv.messages.length > 0)
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]!.createdAt;
        const bLast = b.messages[b.messages.length - 1]!.createdAt;
        return bLast.localeCompare(aLast);
      });

    const result = filtered.map((conv) => ({
      ...serializeConversation(conv as Parameters<typeof serializeConversation>[0]),
      messages: conv.messages.map((m) =>
        serializeDirectMessage(m as Parameters<typeof serializeDirectMessage>[0]),
      ),
    }));

    return c.json(result as unknown as DirectMessageConversationResponse[]);
  })
  .post("/dm", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const body = await c.req.json();
    const peer = await findUserWithProfile(eq(users.id, body?.peerId));
    if (!peer) {
      throw new HTTPException(404);
    }

    let conversation = await findConversationWithRelations(
      or(
        and(
          eq(directMessageConversations.initiatorId, userId),
          eq(directMessageConversations.memberId, peer.id),
        ),
        and(
          eq(directMessageConversations.initiatorId, peer.id),
          eq(directMessageConversations.memberId, userId),
        ),
      )!,
    );

    if (!conversation) {
      const db = getDb();
      const id = uuidv4();
      const now = new Date().toISOString();
      db.insert(directMessageConversations)
        .values({
          id,
          initiatorId: userId,
          memberId: peer.id,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      conversation = await findConversationWithRelations(eq(directMessageConversations.id, id));
    }

    return c.json(
      serializeConversation(
        conversation as Parameters<typeof serializeConversation>[0],
      ) as unknown as DirectMessageConversationResponse,
    );
  })
  .post("/dm/:conversationId/messages", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const reqBody = await c.req.json();
    const body: unknown = reqBody?.body;
    if (typeof body !== "string" || body.trim().length === 0) {
      throw new HTTPException(400);
    }

    const db = getDb();
    const conversationId = c.req.param("conversationId");
    const conversation = db
      .select()
      .from(directMessageConversations)
      .where(
        and(
          eq(directMessageConversations.id, conversationId),
          or(
            eq(directMessageConversations.initiatorId, userId),
            eq(directMessageConversations.memberId, userId),
          ),
        ),
      )
      .get();

    if (!conversation) {
      throw new HTTPException(404);
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();
    db.insert(directMessages)
      .values({
        id: messageId,
        body: body.trim(),
        conversationId: conversation.id,
        senderId: userId,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    await emitDmNotifications(messageId);

    const message = await db.query.directMessages.findFirst({
      where: eq(directMessages.id, messageId),
      with: {
        sender: { with: { profileImage: true } },
      },
    });

    return c.json(
      serializeDirectMessage(
        message as Parameters<typeof serializeDirectMessage>[0],
      ) as unknown as DirectMessageResponse,
      201,
    );
  })
  .post("/dm/:conversationId/read", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const db = getDb();
    const conversationId = c.req.param("conversationId");
    const conversation = db
      .select()
      .from(directMessageConversations)
      .where(
        and(
          eq(directMessageConversations.id, conversationId),
          or(
            eq(directMessageConversations.initiatorId, userId),
            eq(directMessageConversations.memberId, userId),
          ),
        ),
      )
      .get();

    if (!conversation) {
      throw new HTTPException(404);
    }

    const peerId =
      conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

    const targetIds = db
      .select({ id: directMessages.id })
      .from(directMessages)
      .where(
        and(
          eq(directMessages.conversationId, conversation.id),
          eq(directMessages.senderId, peerId),
          eq(directMessages.isRead, false),
        ),
      )
      .all();

    if (targetIds.length > 0) {
      const now = new Date().toISOString();
      db.update(directMessages)
        .set({ isRead: true, updatedAt: now })
        .where(
          and(
            eq(directMessages.conversationId, conversation.id),
            eq(directMessages.senderId, peerId),
            eq(directMessages.isRead, false),
          ),
        )
        .run();

      for (const { id } of targetIds) {
        await emitDmNotifications(id);
      }
    }

    return c.json({});
  })
  .get("/dm/:conversationId", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const conversationId = c.req.param("conversationId");
    const conversation = await findConversationWithRelations(
      and(
        eq(directMessageConversations.id, conversationId),
        or(
          eq(directMessageConversations.initiatorId, userId),
          eq(directMessageConversations.memberId, userId),
        ),
      )!,
    );
    if (!conversation) {
      throw new HTTPException(404);
    }

    return c.json(
      serializeConversation(
        conversation as Parameters<typeof serializeConversation>[0],
      ) as unknown as DirectMessageConversationResponse,
    );
  })
  .post("/dm/:conversationId/typing", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const db = getDb();
    const conversation = db
      .select()
      .from(directMessageConversations)
      .where(eq(directMessageConversations.id, c.req.param("conversationId")))
      .get();

    if (!conversation) {
      throw new HTTPException(404);
    }

    eventhub.emit(`dm:conversation/${conversation.id}:typing/${userId}`, {});

    return c.json({});
  });

// WebSocket routes (not included in RPC type chain)
directMessageRouter.get(
  "/dm/unread",
  upgradeWebSocket((c) => {
    const userId = c.var["session"].get()?.userId;

    return {
      async onOpen(_evt, ws) {
        if (userId === undefined) {
          ws.close();
          return;
        }

        const handler = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:unread", payload }));
        };

        eventhub.on(`dm:unread/${userId}`, handler);
        ws.raw?.addEventListener("close", () => {
          eventhub.off(`dm:unread/${userId}`, handler);
        });

        const unreadCount = countUnreadMessages(userId);
        eventhub.emit(`dm:unread/${userId}`, { unreadCount });
      },
    };
  }),
);

directMessageRouter.get(
  "/dm/:conversationId",
  upgradeWebSocket((c) => {
    const userId = c.var["session"].get()?.userId;
    const conversationId = c.req.param("conversationId")!;

    return {
      async onOpen(_evt, ws) {
        if (userId === undefined) {
          ws.close();
          return;
        }

        const db = getDb();
        const conversation = db
          .select()
          .from(directMessageConversations)
          .where(
            and(
              eq(directMessageConversations.id, conversationId),
              or(
                eq(directMessageConversations.initiatorId, userId),
                eq(directMessageConversations.memberId, userId),
              ),
            ),
          )
          .get();

        if (!conversation) {
          ws.close();
          return;
        }

        const peerId =
          conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

        const handleMessageUpdated = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:message", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
        ws.raw?.addEventListener("close", () => {
          eventhub.off(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
        });

        const handleTyping = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
        ws.raw?.addEventListener("close", () => {
          eventhub.off(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
        });
      },
    };
  }),
);
