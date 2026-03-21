import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { col, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";
import { upgradeWebSocket } from "@web-speed-hackathon-2026/server/src/ws";

export const directMessageRouter = new Hono<AppEnv>();

directMessageRouter.get("/dm", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const conversations = await DirectMessageConversation.findAll({
    include: [{ association: "messages", required: true }],
    where: {
      [Op.or]: [{ initiatorId: c.get("session").userId }, { memberId: c.get("session").userId }],
    },
    order: [[col("messages.createdAt"), "ASC"]],
  });

  return c.json(conversations, 200);
});

directMessageRouter.post("/dm", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const body = await c.req.json();
  const peer = await User.findByPk(body?.peerId);
  if (peer === null) {
    throw new HTTPException(404);
  }

  const userId = c.get("session").userId!;
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

// GET /dm/unread: WebSocket のみ（クライアントは /api/v1/dm/unread に WS 接続）
directMessageRouter.get(
  "/dm/unread",
  async (c, next) => {
    if (c.get("session").userId === undefined) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    return next();
  },
  upgradeWebSocket((c) => {
    const userId = c.get("session").userId!;
    let unreadHandler: ((payload: unknown) => void) | null = null;

    return {
      onOpen: async (_event, ws) => {
        unreadHandler = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:unread", payload }));
        };

        eventhub.on(`dm:unread/${userId}`, unreadHandler);

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
      onClose: () => {
        if (unreadHandler) {
          eventhub.off(`dm:unread/${userId}`, unreadHandler);
        }
      },
    };
  }),
);

// GET /dm/:conversationId: WS upgrade なら WebSocket、それ以外は JSON を返す
// クライアントは同一 URL に WS 接続と HTTP GET の両方を行う
directMessageRouter.get(
  "/dm/:conversationId",
  async (c, next) => {
    if (c.get("session").userId === undefined) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    return next();
  },
  upgradeWebSocket((c) => {
    const userId = c.get("session").userId!;
    const conversationId = c.req.param("conversationId");
    let handleMessageUpdated: ((payload: unknown) => void) | null = null;
    let handleTyping: ((payload: unknown) => void) | null = null;
    let resolvedConversationId: string | null = null;
    let peerId: string | null = null;

    return {
      onOpen: async (_event, ws) => {
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

        resolvedConversationId = conversation.id;
        peerId =
          conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

        handleMessageUpdated = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:message", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);

        handleTyping = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
      },
      onClose: () => {
        if (resolvedConversationId && handleMessageUpdated) {
          eventhub.off(`dm:conversation/${resolvedConversationId}:message`, handleMessageUpdated);
        }
        if (resolvedConversationId && peerId && handleTyping) {
          eventhub.off(
            `dm:conversation/${resolvedConversationId}:typing/${peerId}`,
            handleTyping,
          );
        }
      },
    };
  }),
  // WS upgrade でない場合（通常の HTTP GET）はここに到達する
  async (c) => {
    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [
          { initiatorId: c.get("session").userId },
          { memberId: c.get("session").userId },
        ],
      },
    });
    if (conversation === null) {
      throw new HTTPException(404);
    }

    return c.json(conversation, 200);
  },
);

directMessageRouter.post("/dm/:conversationId/messages", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const reqBody = await c.req.json();
  const body: unknown = reqBody?.body;
  if (typeof body !== "string" || body.trim().length === 0) {
    throw new HTTPException(400);
  }

  const userId = c.get("session").userId!;
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

  return c.json(message, 201);
});

directMessageRouter.post("/dm/:conversationId/read", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const userId = c.get("session").userId!;
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

  return c.json({}, 200);
});

directMessageRouter.post("/dm/:conversationId/typing", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const conversation = await DirectMessageConversation.findByPk(
    c.req.param("conversationId"),
  );
  if (conversation === null) {
    throw new HTTPException(404);
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${c.get("session").userId}`, {});

  return c.json({}, 200);
});
