import fs from "node:fs/promises";

import { Router } from "express";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import { initializeSequelize } from "../../sequelize";
import { clearImageCache, prewarmImageCache } from "../image_resize";
import { sessionStore } from "../../session";

export const initializeRouter = Router();

initializeRouter.post("/initialize", async (_req, res) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  sessionStore.clear();
  // 画像キャッシュをクリア
  clearImageCache();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  // レスポンスを先に返してからプリウォーム（バックグラウンド）
  res.status(200).type("application/json").send({});
  prewarmImageCache().catch(() => {});
  return;
});
