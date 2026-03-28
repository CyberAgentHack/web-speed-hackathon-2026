import { randomBytes } from "node:crypto";

import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "./types.js";

interface SessionData {
  userId?: string;
}

const store = new Map<string, SessionData>();

export const sessionStore = {
  clear() {
    store.clear();
  },
};

export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  let sessionId = getCookie(c, "sid");

  if (!sessionId || !store.has(sessionId)) {
    sessionId = randomBytes(16).toString("hex");
    store.set(sessionId, {});
  }

  const session = store.get(sessionId)!;
  c.set("session", session);

  setCookie(c, "sid", sessionId, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
  });

  await next();
});
