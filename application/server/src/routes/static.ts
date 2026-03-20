import history from "connect-history-api-fallback";
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// ハッシュ付きファイルに長期キャッシュを設定
function setCacheHeaders(req: Request, res: Response, next: NextFunction) {
  const path = req.path.startsWith("/") ? req.path : `/${req.path}`;
  const isVersionedAsset =
    path.startsWith("/scripts/") ||
    path.startsWith("/styles/") ||
    path.startsWith("/static/") ||
    path.startsWith("/images/") ||
    path.startsWith("/movies/") ||
    path.startsWith("/sounds/") ||
    path.startsWith("/profiles/") ||
    /\.(woff2?|ttf|otf|eot)$/.test(path);

  if (isVersionedAsset) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (/\.html$/.test(path) || path === "/") {
    res.setHeader("Cache-Control", "no-cache");
  } else {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
  next();
}

staticRouter.use(setCacheHeaders);

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
