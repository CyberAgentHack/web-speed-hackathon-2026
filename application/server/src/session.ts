import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { v4 as uuidv4 } from "uuid";

import type { Env } from "@web-speed-hackathon-2026/server/src/types";

type SessionData = { userId?: string };

export const sessions = new Map<string, SessionData>();
const SESSION_COOKIE_NAME = "session_id";
const SESSION_SECRET = process.env["SESSION_SECRET"] || "secret";

export const sessionMiddleware = createMiddleware<Env>(async (c, next) => {
  const signedSessionId = await getSignedCookie(c, SESSION_SECRET, SESSION_COOKIE_NAME);
  const existingSessionId = signedSessionId || undefined;

  if (signedSessionId === false) {
    deleteCookie(c, SESSION_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });
  }

  const existingSession = existingSessionId ? sessions.get(existingSessionId) : undefined;

  let sessionId = existingSessionId;
  const session = existingSession ?? {};

  c.set("session", session);
  c.set("sessionId", sessionId ?? "");

  await next();

  const shouldPersist =
    existingSession !== undefined || Object.keys(session).length > 0;

  if (!shouldPersist) {
    return;
  }

  if (sessionId == null) {
    sessionId = uuidv4();
    c.set("sessionId", sessionId);
  }

  if (existingSession === undefined) {
    sessions.set(sessionId, session);
  }

  await setSignedCookie(c, SESSION_COOKIE_NAME, sessionId, SESSION_SECRET, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });
});
