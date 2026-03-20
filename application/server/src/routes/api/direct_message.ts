import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { col, where, Op } from "sequelize";

import { upgradeWebSocket } from "@web-speed-hackathon-2026/server/src/app";
import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
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

    return c.json(sorted as unknown as DirectMessageConversationResponse[]);
  })
  .post("/dm", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const body = await c.req.json();
    const peer = await User.findByPk(body?.peerId);
    if (peer === null) {
      throw new HTTPException(404);
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

    return c.json(conversation.toJSON() as unknown as DirectMessageConversationResponse);
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

    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
    });
    if (conversation === null) {
      throw new HTTPException(404);
    }

    const message = await DirectMessage.create({
      body: body.trim(),
      conversationId: conversation.id,
      senderId: userId,
    });
    await message.reload();

    return c.json(message.toJSON() as unknown as DirectMessageResponse, 201);
  })
  .post("/dm/:conversationId/read", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
    });
    if (conversation === null) {
      throw new HTTPException(404);
    }

    const peerId =
      conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

    await DirectMessage.update(
      { isRead: true },
      {
        where: { conversationId: conversation.id, senderId: peerId, isRead: false },
        individualHooks: true,
      },
    );

    return c.json({});
  })
  .get("/dm/:conversationId", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
    });
    if (conversation === null) {
      throw new HTTPException(404);
    }

    return c.json(conversation.toJSON() as unknown as DirectMessageConversationResponse);
  })
  .post("/dm/:conversationId/typing", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const conversation = await DirectMessageConversation.findByPk(c.req.param("conversationId"));
    if (conversation === null) {
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
      },
    };
  }),
);

directMessageRouter.get(
  "/dm/:conversationId",
  upgradeWebSocket((c) => {
    const userId = c.var["session"].get()?.userId;
    const conversationId = c.req.param("conversationId");

    return {
      async onOpen(_evt, ws) {
        if (userId === undefined) {
          ws.close();
          return;
        }

        const conversation = await DirectMessageConversation.findOne({
          where: {
            id: conversationId,
            [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
          },
        });
        if (conversation == null) {
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
