import { Router } from "express";

import { emptyS3Bucket } from "@web-speed-hackathon-2026/server/src/utils/s3";

import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";

export const initializeRouter = Router();

initializeRouter.post("/initialize", async (_req, res) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  sessionStore.clear();
  // S3バケットをクリア
  await emptyS3Bucket();

  return res.status(200).type("application/json").send({});
});
