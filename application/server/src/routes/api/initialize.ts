import fs from "node:fs/promises";

import { Hono } from "hono";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { sessions } from "@web-speed-hackathon-2026/server/src/session";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";

import { initializeSequelize } from "../../sequelize";

export const initializeRouter = new Hono<Env>();

initializeRouter.post("/initialize", async (c) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  sessions.clear();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return c.json({});
});
