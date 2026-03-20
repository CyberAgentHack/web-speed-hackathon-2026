import { Router } from "express";

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
