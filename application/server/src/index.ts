import type { IncomingMessage } from "node:http";

import { createAdaptorServer } from "@hono/node-server";
import { Op } from "sequelize";
import { WebSocketServer } from "ws";

import { app } from "@web-speed-hackathon-2026/server/src/app";
import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
} from "@web-speed-hackathon-2026/server/src/models";

import { initializeSequelize } from "./sequelize";
import { sessionStore } from "./session";

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

async function getSessionUserId(req: IncomingMessage): Promise<string | null> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies["session_id"];
  if (!sessionId) {
    return null;
  }

  const session = await new Promise<Record<string, unknown> | null>((resolve) => {
    sessionStore.get(sessionId, (_err, sess) => resolve(sess ?? null));
  });

  const userId = session?.["userId"];
  return typeof userId === "string" ? userId : null;
}

async function getUnreadCount(userId: string): Promise<number> {
  return await DirectMessage.count({
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
}

function rejectUpgrade(socket: import("node:net").Socket, status: 400 | 401 | 404) {
  const statusText = status === 400 ? "Bad Request" : status === 401 ? "Unauthorized" : "Not Found";
  socket.write(`HTTP/1.1 ${status} ${statusText}\r\n\r\n`);
  socket.destroy();
}

async function main() {
  await initializeSequelize();

  const port = Number(process.env["PORT"] || 3000);
  const hostname = "0.0.0.0";

  const server = createAdaptorServer({
    fetch: app.fetch,
    port,
    hostname,
  });
  const wsServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    let url: URL;
    try {
      url = new URL(req.url ?? "", `http://${req.headers.host ?? "localhost"}`);
    } catch {
      rejectUpgrade(socket, 400);
      return;
    }

    const unreadPath = url.pathname === "/api/v1/dm/unread";
    const conversationMatch = url.pathname.match(/^\/api\/v1\/dm\/([^/]+)$/);
    if (!unreadPath && !conversationMatch) {
      rejectUpgrade(socket, 404);
      return;
    }

    const userId = await getSessionUserId(req);
    if (userId == null) {
      rejectUpgrade(socket, 401);
      return;
    }

    if (unreadPath) {
      wsServer.handleUpgrade(req, socket, head, (ws) => {
        let closed = false;
        const cleanup = () => {
          if (closed) {
            return;
          }
          closed = true;
          eventhub.off(`dm:unread/${userId}`, onUnread);
        };

        const sendUnread = async () => {
          const unreadCount = await getUnreadCount(userId);
          ws.send(
            JSON.stringify({
              type: "dm:unread",
              payload: { unreadCount },
            }),
          );
        };

        const onUnread = async () => {
          if (ws.readyState === ws.OPEN) {
            await sendUnread();
          }
        };

        void sendUnread();
        eventhub.on(`dm:unread/${userId}`, onUnread);
        ws.on("close", cleanup);
        ws.on("error", cleanup);
      });
      return;
    }

    const conversationId = conversationMatch?.[1];
    if (!conversationId) {
      rejectUpgrade(socket, 400);
      return;
    }

    const conversation = await DirectMessageConversation.findOne({
      attributes: ["id", "initiatorId", "memberId"],
      where: {
        id: conversationId,
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
    });
    if (conversation == null) {
      rejectUpgrade(socket, 404);
      return;
    }

    const peerId = conversation.initiatorId === userId ? conversation.memberId : conversation.initiatorId;
    const messageChannel = `dm:conversation/${conversation.id}:message`;
    const typingChannel = `dm:conversation/${conversation.id}:typing/${peerId}`;

    wsServer.handleUpgrade(req, socket, head, (ws) => {
      let closed = false;
      const cleanup = () => {
        if (closed) {
          return;
        }
        closed = true;
        eventhub.off(messageChannel, onMessage);
        eventhub.off(typingChannel, onTyping);
      };

      const onMessage = (payload: unknown) => {
        const normalizedPayload =
          typeof payload === "object" &&
          payload !== null &&
          "toJSON" in payload &&
          typeof (payload as { toJSON: () => unknown }).toJSON === "function"
            ? (payload as { toJSON: () => unknown }).toJSON()
            : payload;
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "dm:conversation:message", payload: normalizedPayload }));
        }
      };

      const onTyping = (payload: unknown) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
        }
      };

      eventhub.on(messageChannel, onMessage);
      eventhub.on(typingChannel, onTyping);
      ws.on("close", cleanup);
      ws.on("error", cleanup);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`Listening on ${hostname}:${port}`);
  });
}

main().catch(console.error);
