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
    immutable: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    immutable: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
        return;
      }

      if (/-[0-9a-f]{8,}\./i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  }),
);
