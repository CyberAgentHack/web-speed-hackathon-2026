import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { ssrRouter } from "@web-speed-hackathon-2026/server/src/routes/ssr";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(compression());
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use("/api/v1", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store");
  return next();
}, apiRouter);
app.use(ssrRouter);
app.use(staticRouter);
