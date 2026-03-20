import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// コンテンツハッシュ付きの不変アセットは長期キャッシュ
staticRouter.use("/scripts/chunk-", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/assets/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/styles/fonts/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
  }),
);
