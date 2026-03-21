import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(compression());
app.use(sessionMiddleware);
app.use(bodyParser.raw({ limit: "10mb", type: "application/octet-stream" }));
app.use(bodyParser.json());

app.use((_req, res, next) => {
  // API エンドポイントはキャッシュしない
  if (_req.path.startsWith("/api/")) {
    res.header({
      "Cache-Control": "max-age=0, no-transform",
      Connection: "close",
    });
  } else {
    // 静的ファイル（画像、動画、JS、CSS）は長期キャッシュ
    res.header({
      "Cache-Control": "public, max-age=31536000, immutable",
      Connection: "close",
    });
  }
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
