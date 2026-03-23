import fs from "node:fs/promises";

import { Router } from "express";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";

export const initializeRouter = Router();

// GET でも疎通確認ができるようにする（本来は POST のみだがデバッグと利便性のため）
const handleInitialize = async (_req: any, res: any) => {
  try {
    // DBリセット
    await initializeSequelize();
    // sessionStoreをクリア
    sessionStore.clear();
    // uploadディレクトリをクリア
    try {
      await fs.rm(UPLOAD_PATH, { force: true, recursive: true });
    } catch (e) {
      console.error("Failed to remove upload path:", e);
    }
    await fs.mkdir(UPLOAD_PATH, { recursive: true });

    return res.status(200).type("application/json").send({});
  } catch (error: any) {
    console.error("Initialize failed:", error);
    return res.status(500).json({ error: error.message });
  }
};

initializeRouter.post("/initialize", handleInitialize);
initializeRouter.get("/initialize", handleInitialize);
