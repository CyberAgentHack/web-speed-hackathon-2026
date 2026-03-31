import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

const compressionMiddleware = compression();
app.use((req, res, next) => {
  // SSE エンドポイントは圧縮バッファリングすると一括送信になるためスキップ
  if (req.url.startsWith("/api/v1/crok") && !req.url.includes("suggestions")) {
    return next();
  }
  compressionMiddleware(req, res, next);
});
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "50mb" }));

app.use("/api", (_req, res, next) => {
  res.header("Cache-Control", "no-store");
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
