import fs from "node:fs/promises";

import { Router } from "express";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import { initializeCrokCache } from "./crok";
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
  // DB切り替え後にCrokサジェストキャッシュを再構築
  await initializeCrokCache();

  return res.status(200).type("application/json").send({});
});
