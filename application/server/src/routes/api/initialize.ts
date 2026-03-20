import fs from "node:fs/promises";
import { Hono } from "hono";
import type { Context } from "hono";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";

export const initializeRouter = new Hono();

initializeRouter.post("/initialize", async (c: Context) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  await new Promise<void>((resolve) => {
    sessionStore.clear(() => resolve());
  });
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return c.json({}, 200);
});
