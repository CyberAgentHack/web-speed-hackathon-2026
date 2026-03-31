import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

// 圧縮ミドルウェアを最初に適用（全レスポンスを圧縮）
app.use(
  compression({
    level: 6, // 圧縮レベル（0-9、デフォルトは6）バランスが良い
    threshold: 1024, // 1KB以上のレスポンスのみ圧縮（小さいファイルは圧縮しない）
    filter: (req, res) => {
      // 圧縮すべきかどうかを判断
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

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