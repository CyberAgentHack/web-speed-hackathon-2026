import fs from "node:fs/promises";

import { Hono } from "hono";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { invalidateAllSessions } from "@web-speed-hackathon-2026/server/src/session";

import { initializeSequelize } from "../../sequelize";

export const initializeRouter = new Hono();

initializeRouter.post("/initialize", async (_c) => {
  // DBリセット
  await initializeSequelize();
  // セッションを全て無効化
  invalidateAllSessions();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return _c.json({});
});
