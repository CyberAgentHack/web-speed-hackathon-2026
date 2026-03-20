import history from "connect-history-api-fallback";
import { type Request, type Response, Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// Hashed static assets (scripts/chunk-*, styles/) get long-term immutable cache
staticRouter.use((req: Request, res: Response, next) => {
  if (/^\/scripts\/chunk-[^/]+\.js$/.test(req.path) || /^\/styles\//.test(req.path)) {
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
    maxAge: "1d",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
  }),
);
