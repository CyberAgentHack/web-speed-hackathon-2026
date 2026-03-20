import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const staticCacheOptions = {
  etag: true,
  lastModified: true,
  setHeaders: (res: any) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  },
};

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(serveStatic(UPLOAD_PATH, staticCacheOptions));
staticRouter.use(serveStatic(PUBLIC_PATH, staticCacheOptions));
staticRouter.use(serveStatic(CLIENT_DIST_PATH, staticCacheOptions));
