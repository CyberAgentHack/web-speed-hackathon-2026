import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

// gzip圧縮: JS/CSS/HTML/JSONの転送サイズを大幅削減 (最高圧縮レベル適用)
app.use(compression({ level: 9, threshold: 0 }));

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

// APIルートのみ no-transform を適用（静的ファイルのキャッシュヘッダーを妨害しない）
app.use("/api/v1", (_req, res, next) => {
  res.header({ "Cache-Control": "no-transform" });
  return next();
}, apiRouter);

app.use(staticRouter);
