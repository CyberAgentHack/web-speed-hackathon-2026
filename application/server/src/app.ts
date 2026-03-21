import bodyParser from "body-parser";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

// 静的ファイルを先に処理（キャッシュヘッダーを有効にするため）
app.use(staticRouter);

// API用のキャッシュ無効化ヘッダー（静的ファイルには適用されない）
app.use("/api/v1", (_req, res, next) => {
  res.header({
    "Cache-Control": "max-age=0, no-transform",
    Connection: "close",
  });
  return next();
});

app.use("/api/v1", apiRouter);

app.get("/favicon.ico", (_req, res) => res.status(204).end());