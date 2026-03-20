import type { ServerResponse } from "http";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

function setLongLivedCacheHeaders(res: ServerResponse) {
  res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
}

function setDistCacheHeaders(res: ServerResponse, filePath: string) {
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store");
    return;
  }

  if (filePath.includes("/assets/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  setLongLivedCacheHeaders(res);
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: setLongLivedCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: setLongLivedCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setDistCacheHeaders,
  }),
);
