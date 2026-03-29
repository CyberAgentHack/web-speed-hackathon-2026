import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

// gzip圧縮を有効化（転送サイズ60-70%削減）
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

// 静的ファイルは長期キャッシュ、APIはキャッシュなし
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|woff2|webp|avif|mp4|webm)$/)) {
    res.header("Cache-Control", "public, max-age=31536000, immutable");
  } else if (req.path.match(/\.(jpg|png|gif|svg)$/)) {
    res.header("Cache-Control", "public, max-age=86400");
  } else if (req.path.startsWith("/api/")) {
    res.header("Cache-Control", "no-store");
  }
  // Connection: close を削除 (Keep-Alive有効化)
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
