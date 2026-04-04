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

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: false,
        setHeaders: (res, path) => {
        res.setHeader(
          "Cache-Control",
          "public, max-age=2160000, immutable"
        );
      
    }
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: false,
    maxAge: 31536000,
    immutable: true,
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        // HTMLは再検証
        res.setHeader("Cache-Control", "no-cache");
      } else {
        // その他は強キャッシュ
        res.setHeader(
          "Cache-Control",
          "public, max-age=31536000, immutable"
        );
      }
    },
  }),
);
