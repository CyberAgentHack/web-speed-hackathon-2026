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

staticRouter.use((req, res, next) => {
  if (
    req.path.startsWith("/images/") ||
    req.path.startsWith("/movies/") ||
    req.path.startsWith("/sounds/")
  ) {
    res.header({
      // 30分ブラウザキャッシュ
      "Cache-Control": `private, max-age=${60 * 30}, immutable`,
    });
  }
  return next();
});
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    cacheControl: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    cacheControl: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    cacheControl: true,
  }),
);
