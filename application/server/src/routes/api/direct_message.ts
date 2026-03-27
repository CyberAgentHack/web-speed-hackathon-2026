import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { col, where, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";
import {
  badRequest,
  notFound,
  unauthorized,
} from "@web-speed-hackathon-2026/server/src/utils/http_error";
import { readJsonBody } from "@web-speed-hackathon-2026/server/src/utils/request_body";
import { upgradeWebSocket } from "@web-speed-hackathon-2026/server/src/ws";

export const directMessageRouter = new Hono<Env>();

directMessageRouter.get("/dm", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const userId = c.get("session").userId!;

  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.and]: [
        { [Op.or]: [{ initiatorId: userId }, { memberId: userId }] },
        where(col("messages.id"), { [Op.not]: null }),
      ],
    },
    order: [[col("messages.createdAt"), "DESC"]],
  });

  const sorted = conversations.map((conv) => ({
    ...conv.toJSON(),
    messages: conv.messages?.reverse(),
  }));

  return c.json(sorted);
});

directMessageRouter.post("/dm", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const userId = c.get("session").userId!;
  let body: { peerId?: string } | undefined;
  try {
    body = await readJsonBody<{ peerId?: string }>(c.req.raw);
  } catch (error) {
    if (
      error instanceof HTTPException &&
      error.status === 400 &&
      Number(c.req.header("content-length") ?? "0") === 0
    ) {
      body = undefined;
    } else {
      throw error;
    }
  }
  const peer = await User.findByPk(body?.peerId);
  if (peer === null) {
    notFound();
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

directMessageRouter.get("/dm/unread", async (c, next) => {
  const session = c.get("session");
  if (session.userId === undefined) {
    unauthorized();
  }

  const userId = session.userId;
  const wsHandler = upgradeWebSocket(() => {
    let unreadHandler: ((payload: unknown) => void) | null = null;

    return {
      onOpen(_event, ws) {
        unreadHandler = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:unread", payload }));
        };

        eventhub.on(`dm:unread/${userId}`, unreadHandler);

        DirectMessage.count({
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
        }).then((unreadCount) => {
          eventhub.emit(`dm:unread/${userId}`, { unreadCount });
        });
      },
      onClose() {
        if (unreadHandler) {
          eventhub.off(`dm:unread/${userId}`, unreadHandler);
        }
      },
    };
  });

  return wsHandler(c, next);
});

directMessageRouter.get("/dm/:conversationId", async (c, next) => {
  // WebSocket upgrade
  if (c.req.header("upgrade")?.toLowerCase() === "websocket") {
    const session = c.get("session");
    if (session.userId === undefined) {
      unauthorized();
    }

    const userId = session.userId;
    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
    });
    if (conversation === null) {
      notFound();
    }

    const conversationId = conversation.id;
    const peerId =
      conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

    const wsHandler = upgradeWebSocket(() => {
      let messageHandler: ((payload: unknown) => void) | null = null;
      let typingHandler: ((payload: unknown) => void) | null = null;

      return {
        onOpen(_event, ws) {
          messageHandler = (payload: unknown) => {
            ws.send(JSON.stringify({ type: "dm:conversation:message", payload }));
          };
          eventhub.on(`dm:conversation/${conversationId}:message`, messageHandler);

          typingHandler = (payload: unknown) => {
            ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
          };
          eventhub.on(`dm:conversation/${conversationId}:typing/${peerId}`, typingHandler);
        },
        onClose() {
          if (messageHandler) {
            eventhub.off(`dm:conversation/${conversationId}:message`, messageHandler);
          }
          if (typingHandler) {
            eventhub.off(`dm:conversation/${conversationId}:typing/${peerId}`, typingHandler);
          }
        },
      };
    });

    return wsHandler(c, next);
  }

  // Regular GET
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const userId = c.get("session").userId!;

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: c.req.param("conversationId"),
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    notFound();
  }

  return c.json(conversation);
});

directMessageRouter.post("/dm/:conversationId/messages", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const userId = c.get("session").userId!;
  const body = await readJsonBody<{ body?: unknown }>(c.req.raw);
  const bodyText: unknown = body?.body;
  if (typeof bodyText !== "string" || bodyText.trim().length === 0) {
    badRequest();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: c.req.param("conversationId"),
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    notFound();
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
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const userId = c.get("session").userId!;

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: c.req.param("conversationId"),
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    notFound();
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
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const userId = c.get("session").userId!;

  const conversation = await DirectMessageConversation.findByPk(c.req.param("conversationId"));
  if (conversation === null) {
    notFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${userId}`, {});

  return c.json({});
});
