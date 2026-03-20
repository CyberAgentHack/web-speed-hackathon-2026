import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { createImageOptimizeMiddleware } from "@web-speed-hackathon-2026/server/src/routes/image_optimize";

export const staticRouter = Router();

// 画像を Sharp で最適化して配信（JPEG resize 1200px + mozjpeg q80）
staticRouter.use(createImageOptimizeMiddleware([UPLOAD_PATH, PUBLIC_PATH]));

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);
