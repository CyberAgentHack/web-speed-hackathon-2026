import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    maxAge: "1h",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    maxAge: "30d",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    maxAge: "1y",
    immutable: true,
  }),
);

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    maxAge: 0,
  }),
);
