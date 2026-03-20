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

    return res.status(200).type("application/json").send({});
});
