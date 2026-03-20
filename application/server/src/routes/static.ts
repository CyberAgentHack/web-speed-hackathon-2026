import history from "connect-history-api-fallback";
import compression from "compression";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();
const commonCompression = compression({ threshold: 0 });

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// SVG のみ gzip 圧縮して配信する
staticRouter.use((req, res, next) => {
  if (req.path.endsWith(".svg")) {
    commonCompression(req, res, next);
    return;
  }
  next();
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000");
    },
  }),
);

// dist 配下は常時 gzip 圧縮して配信する
staticRouter.use(commonCompression);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000");
    },
  }),
);
