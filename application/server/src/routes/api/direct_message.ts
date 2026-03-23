import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import { getSession } from "@web-speed-hackathon-2026/server/src/session";
import { parseJSON } from "@web-speed-hackathon-2026/server/src/utils/parse_json";
import { upgradeWebSocket } from "@web-speed-hackathon-2026/server/src/websocket";

export const directMessageRouter = new Hono();

directMessageRouter.get("/dm", async (c) => {
  const userId = getSession(c);
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
      {
        association: "messages",
        include: [{ association: "sender", include: [{ association: "profileImage" }] }],
        order: [["createdAt", "DESC"]],
        // separate: true で会話ごとに別クエリ（limitが正しく機能する）
        separate: true,
        limit: 50,
      },
    ],
  });

  // 最終メッセージのタイムスタンプで降順ソート（メッセージなしは末尾）
  const sorted = conversations
    .filter((conv) => (conv.messages?.length ?? 0) > 0)
    .sort((a, b) => {
      const aTime = new Date(a.messages![0]!.createdAt).getTime();
      const bTime = new Date(b.messages![0]!.createdAt).getTime();
      return bTime - aTime;
    })
    .map((conv) => ({
      ...conv.toJSON(),
      messages: conv.messages?.slice().reverse(), // ASC順に戻す（クライアントが .at(-1) で最新を取得）
    }));

  return c.json(sorted);
});

directMessageRouter.post("/dm", async (c) => {
  const userId = getSession(c);
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await parseJSON(c);
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

  return c.json(conversation);
});

// WebSocket: unread count notifications
// Must be registered before /dm/:conversationId to avoid param capture
directMessageRouter.get(
  "/dm/unread",
  upgradeWebSocket(async (c) => {
    const userId = getSession(c);
    if (userId === undefined) {
      return {
        onOpen(_event, ws) {
          ws.close(1008, "Unauthorized");
        },
      };
    }

    let handler: ((payload: unknown) => void) | null = null;

    return {
      async onOpen(_event, ws) {
        handler = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:unread", payload }));
        };

        eventhub.on(`dm:unread/${userId}`, handler);

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
      onClose() {
        if (handler) {
          eventhub.off(`dm:unread/${userId}`, handler);
        }
      },
    };
  }),
);

// HTTP GET: get conversation details
// WebSocket GET: real-time messages (upgradeWebSocket calls next() for non-WS requests)
directMessageRouter.get(
  "/dm/:conversationId",
  upgradeWebSocket(async (c) => {
    const userId = getSession(c);
    if (userId === undefined) {
      return {
        onOpen(_event, ws) {
          ws.close(1008, "Unauthorized");
        },
      };
    }

    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
    });
    if (conversation == null) {
      return {
        onOpen(_event, ws) {
          ws.close(1008, "Not Found");
        },
      };
    }

    const peerId =
      conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

    let handleMessageUpdated: ((payload: unknown) => void) | null = null;
    let handleTyping: ((payload: unknown) => void) | null = null;

    return {
      onOpen(_event, ws) {
        handleMessageUpdated = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:message", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);

        handleTyping = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
      },
      onClose() {
        if (handleMessageUpdated) {
          eventhub.off(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
        }
        if (handleTyping) {
          eventhub.off(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
        }
      },
    };
  }),
  // HTTP fallback handler
  async (c) => {
    const userId = getSession(c);
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
      include: [
        {
          association: "messages",
          include: [{ association: "sender", include: [{ association: "profileImage" }] }],
          order: [["createdAt", "ASC"]],
          separate: true,
        },
      ],
    });
    if (conversation === null) {
      throw new HTTPException(404);
    }

    return c.json(conversation);
  },
);

directMessageRouter.post("/dm/:conversationId/messages", async (c) => {
  const userId = getSession(c);
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await parseJSON(c);
  const bodyText: unknown = body?.body;
  if (typeof bodyText !== "string" || bodyText.trim().length === 0) {
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
    body: bodyText.trim(),
    conversationId: conversation.id,
    senderId: userId,
  });
  await message.reload();

  return c.json(message, 201);
});

directMessageRouter.post("/dm/:conversationId/read", async (c) => {
  const userId = getSession(c);
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
});

directMessageRouter.post("/dm/:conversationId/typing", async (c) => {
  const userId = getSession(c);
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
