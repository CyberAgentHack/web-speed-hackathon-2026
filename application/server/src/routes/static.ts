import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

const staticOpts = {
  etag: true,
  lastModified: true,
  maxAge: "7d",
  immutable: true,
} as const;

staticRouter.use(serveStatic(UPLOAD_PATH, staticOpts));
staticRouter.use(serveStatic(PUBLIC_PATH, staticOpts));
staticRouter.use(serveStatic(CLIENT_DIST_PATH, staticOpts));
