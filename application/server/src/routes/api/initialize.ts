import fs from "node:fs/promises";

import { Router } from "express";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";
import { clearHomeCache, warmHomeCache } from "../static";

export const initializeRouter = Router();

initializeRouter.post("/initialize", async (_req, res) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  sessionStore.clear();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });
  // ホームHTMLキャッシュを再構築
  clearHomeCache();
  await warmHomeCache();

  return res.status(200).type("application/json").send({});
});
