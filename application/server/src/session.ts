import { createHmac } from "node:crypto";

import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";

const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "secret";

// Incremented on /initialize to invalidate all existing sessions
let sessionGeneration = 1;

function sign(data: string): string {
  return createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
}

export function setSession(c: Context, userId: string): void {
  const payload = `${userId}.${sessionGeneration}`;
  const sig = sign(payload);
  setCookie(c, "session", `${payload}.${sig}`, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
  });
}

export function getSession(c: Context): string | undefined {
  const cookie = getCookie(c, "session");
  if (cookie == null) return undefined;
  const lastDot = cookie.lastIndexOf(".");
  if (lastDot < 0) return undefined;
  const payload = cookie.slice(0, lastDot);
  const sig = cookie.slice(lastDot + 1);
  if (sign(payload) !== sig) return undefined;
  const parts = payload.split(".");
  // payload = "{userId}.{generation}"
  if (parts.length < 2) return undefined;
  const gen = Number(parts[parts.length - 1]);
  if (gen !== sessionGeneration) return undefined;
  // userId may contain dots, so everything except the last part
  const userId = parts.slice(0, -1).join(".");
  return userId;
}

export function clearSession(c: Context): void {
  deleteCookie(c, "session", { path: "/" });
}

export function invalidateAllSessions(): void {
  sessionGeneration++;
}
