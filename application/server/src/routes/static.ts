import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const STATIC_MAX_AGE_SECONDS = 300;

const HASH_ASSET_RE = /\.[0-9a-f]{8,}\.(js|css|woff2?)$/i;

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: STATIC_MAX_AGE_SECONDS * 1000,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", `public, max-age=${STATIC_MAX_AGE_SECONDS}, must-revalidate`);
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: STATIC_MAX_AGE_SECONDS * 1000,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (HASH_ASSET_RE.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", `public, max-age=${STATIC_MAX_AGE_SECONDS}, must-revalidate`);
      }
    },
  }),
);
