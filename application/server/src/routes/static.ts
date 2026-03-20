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
  const url = req.url;
  if (/\/scripts\/chunk-/.test(url) || /\/static\//.test(url) || /\/styles\//.test(url)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (/\.html$/.test(url) || url === "/") {
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
