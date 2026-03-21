import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { imageServeRouter } from "@web-speed-hackathon-2026/server/src/routes/image_serve";

export const staticRouter = Router();

// ?q=s|m|l による動的リサイズ（静的配信・SPA フォールバックより前に処理）
staticRouter.use(imageServeRouter);

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

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
