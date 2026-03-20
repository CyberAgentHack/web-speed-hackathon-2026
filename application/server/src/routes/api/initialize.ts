import fs from "node:fs/promises";

import { Hono } from "hono";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";

export const initializeRouter = new Hono<SessionEnv>();

initializeRouter.post("/initialize", async (c) => {
  await initializeSequelize();
  sessionStore.clear();
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return c.json({});
});
