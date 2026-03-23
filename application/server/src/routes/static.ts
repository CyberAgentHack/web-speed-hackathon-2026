import history from "connect-history-api-fallback";
import { Router, Request, Response, NextFunction } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// コンテンツハッシュ付き静的アセット（JS/CSS）は長期キャッシュ
staticRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (/\.[0-9a-f]{8,}\.(js|css)$/.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});

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
