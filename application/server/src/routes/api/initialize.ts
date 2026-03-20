import fs from "node:fs/promises";

import { Hono } from "hono";

import { initializeDb } from "@web-speed-hackathon-2026/server/src/db";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { clearSsrCache } from "@web-speed-hackathon-2026/server/src/routes/ssr";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import { sessionStore } from "@web-speed-hackathon-2026/server/src/session";

export const initializeRouter = new Hono<SessionEnv>().post("/initialize", async (c) => {
  await initializeDb();
  sessionStore.clear();
  clearSsrCache();
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return c.json({});
});
