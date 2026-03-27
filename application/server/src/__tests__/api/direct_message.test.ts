import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import {
  observeWebSocket,
  requestWithSession,
  signupAndGetCookie,
  waitForWebSocketOpen,
} from "../helpers";

setupApiTestFile();

describe("GET /api/v1/dm", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/dm");
    expect(res.status).toBe(401);
  });

  test("returns 200 with conversations when authenticated", async () => {
    const { cookie } = await signupAndGetCookie(app, "dm_list_user", "pass123");
    const res = await app.request("/api/v1/dm", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("POST /api/v1/dm", () => {
  test("returns 200 with conversation when peer exists", async () => {
    const { cookie: cookie1 } = await signupAndGetCookie(app, "dm_create_a", "pass123");
    const { body: user2 } = await signupAndGetCookie(app, "dm_create_b", "pass123");

    const res = await requestWithSession(app, "POST", "/api/v1/dm", cookie1, {
      peerId: user2["id"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
  });

  test("returns 404 when peer does not exist", async () => {
    const { cookie } = await signupAndGetCookie(app, "dm_create_nopeer", "pass123");
    const res = await requestWithSession(app, "POST", "/api/v1/dm", cookie, {
      peerId: "00000000-0000-0000-0000-000000000000",
    });
    expect(res.status).toBe(404);
  });

  test("returns 404 for empty body when authenticated", async () => {
    const { cookie } = await signupAndGetCookie(app, "dm_empty_body_user", "pass123");
    const res = await app.request("/api/v1/dm", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(404);
  });
});

async function createConversation() {
  const { cookie: cookie1, body: user1 } = await signupAndGetCookie(
    app,
    `dm_conv_a_${Date.now()}`,
    "pass123",
  );
  const { cookie: cookie2, body: user2 } = await signupAndGetCookie(
    app,
    `dm_conv_b_${Date.now()}`,
    "pass123",
  );

  const convRes = await requestWithSession(app, "POST", "/api/v1/dm", cookie1, {
    peerId: user2["id"],
  });
  const conversation = (await convRes.json()) as { id: string };
  return { cookie1, cookie2, user1, user2, conversation };
}

describe("GET /api/v1/dm/:id", () => {
  test("returns 200 with conversation when authenticated", async () => {
    const { cookie1, conversation } = await createConversation();
    const res = await app.request(`/api/v1/dm/${conversation.id}`, {
      headers: { Cookie: cookie1 },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(conversation.id);
  });

  test("returns 404 when authenticated user is not a participant", async () => {
    const { conversation } = await createConversation();
    const { cookie } = await signupAndGetCookie(app, "dm_intruder_user", "pass123");

    const res = await app.request(`/api/v1/dm/${conversation.id}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(404);
  });
});

describe("WebSocket /api/v1/dm/unread", () => {
  test("emits unread counts for the authenticated user", async () => {
    const { cookie1, cookie2, conversation } = await createConversation();

    const socket = app.connectWebSocket("/api/v1/dm/unread", cookie2);
    const ws = observeWebSocket<{
      type: string;
      payload: { unreadCount: number };
    }>(socket);
    await waitForWebSocketOpen(socket);

    const initialMessage = await ws.nextMessage();
    expect(initialMessage.type).toBe("dm:unread");
    expect(initialMessage.payload.unreadCount).toBe(0);

    const sendRes = await requestWithSession(
      app,
      "POST",
      `/api/v1/dm/${conversation.id}/messages`,
      cookie1,
      { body: "Unread ping" },
    );
    expect(sendRes.status).toBe(201);

    const unreadMessage = await ws.nextMessage();
    expect(unreadMessage.type).toBe("dm:unread");
    expect(unreadMessage.payload.unreadCount).toBe(1);

    socket.close();
  });
});

describe("WebSocket /api/v1/dm/:id", () => {
  test("emits conversation messages to the authenticated participant", async () => {
    const { cookie1, cookie2, conversation } = await createConversation();

    const socket = app.connectWebSocket(`/api/v1/dm/${conversation.id}`, cookie2);
    const ws = observeWebSocket<{
      type: string;
      payload: { body: string; conversationId: string };
    }>(socket);
    await waitForWebSocketOpen(socket);

    const sendRes = await requestWithSession(
      app,
      "POST",
      `/api/v1/dm/${conversation.id}/messages`,
      cookie1,
      { body: "Hello over ws" },
    );
    expect(sendRes.status).toBe(201);

    const wsMessage = await ws.nextMessage();
    expect(wsMessage.type).toBe("dm:conversation:message");
    expect(wsMessage.payload.body).toBe("Hello over ws");
    expect(wsMessage.payload.conversationId).toBe(conversation.id);

    socket.close();
  });
});

describe("POST /api/v1/dm/:id/messages", () => {
  test("returns 400 for empty body", async () => {
    const { cookie1, conversation } = await createConversation();
    const res = await requestWithSession(
      app,
      "POST",
      `/api/v1/dm/${conversation.id}/messages`,
      cookie1,
      { body: "" },
    );
    expect(res.status).toBe(400);
  });

  test("returns 201 with message on success", async () => {
    const { cookie1, conversation } = await createConversation();
    const res = await requestWithSession(
      app,
      "POST",
      `/api/v1/dm/${conversation.id}/messages`,
      cookie1,
      { body: "Hello!" },
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.body).toBe("Hello!");
  });
});

describe("POST /api/v1/dm/:id/read", () => {
  test("returns 200", async () => {
    const { cookie1, conversation } = await createConversation();
    const res = await requestWithSession(
      app,
      "POST",
      `/api/v1/dm/${conversation.id}/read`,
      cookie1,
      {},
    );
    expect(res.status).toBe(200);
  });
});

describe("POST /api/v1/dm/:id/typing", () => {
  test("returns 200", async () => {
    const { cookie1, conversation } = await createConversation();
    const res = await requestWithSession(
      app,
      "POST",
      `/api/v1/dm/${conversation.id}/typing`,
      cookie1,
      {},
    );
    expect(res.status).toBe(200);
  });
});
