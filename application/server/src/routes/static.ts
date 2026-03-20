import type { ServerResponse } from "node:http";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

function setStaticHeaders(res: ServerResponse, filePath: string) {
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  if (filePath.startsWith(path.join(CLIENT_DIST_PATH, "scripts")) || filePath.startsWith(path.join(CLIENT_DIST_PATH, "styles"))) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  if (filePath.startsWith(UPLOAD_PATH)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=3600");
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: setStaticHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: setStaticHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setStaticHeaders,
  }),
);
