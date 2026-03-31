import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const setStaticCacheHeaders = (res: { setHeader: (name: string, value: string) => void }): void => {
  res.setHeader("Cache-Control", "public, max-age=300, immutable");
};

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setStaticCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setStaticCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setStaticCacheHeaders,
  }),
);
