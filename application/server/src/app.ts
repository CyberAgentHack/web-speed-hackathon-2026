import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

// gzip/brotli compression
app.use(compression());

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

// APIレスポンスのキャッシュ無効化（静的ファイルは別途設定）
app.use("/api", (_req, res, next) => {
  res.header({
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
