import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(compression({ level: 9 }));

// Session and body parsers only for API routes (skip for static files)
app.use("/api/v1", sessionMiddleware, bodyParser.json(), bodyParser.raw({ limit: "10mb" }), apiRouter);
app.use(staticRouter);
