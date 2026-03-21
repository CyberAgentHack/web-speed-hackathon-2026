import fs from "node:fs/promises";

import { Hono } from "hono";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

import { initializeSequelize } from "../../sequelize.js";
import { sessionStore } from "../../session.js";

export const initializeRouter = new Hono<AppEnv>();

initializeRouter.post("/initialize", async (_c) => {
  await initializeSequelize();
  sessionStore.clear();
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return _c.json({}, 200);
});
