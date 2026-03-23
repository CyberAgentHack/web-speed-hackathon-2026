import fs from "node:fs/promises";

import { Router } from "express";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { warmHtmlCache, clearHtmlCache } from "@web-speed-hackathon-2026/server/src/routes/prefetch";
import { clearCache } from "@web-speed-hackathon-2026/server/src/utils/response_cache";

import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";

export const initializeRouter = Router();

initializeRouter.post("/initialize", async (_req, res) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  sessionStore.clear();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });
  // キャッシュクリア＆再生成
  clearCache();
  clearHtmlCache();
  await warmHtmlCache();

  return res.status(200).type("application/json").send({});
});
