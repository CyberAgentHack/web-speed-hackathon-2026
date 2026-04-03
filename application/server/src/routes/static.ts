import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { ssrRouter } from "@web-speed-hackathon-2026/server/src/routes/ssr";

export const staticRouter = Router();

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    maxAge: "1d",
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    maxAge: "7d",
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    maxAge: "1y",
    etag: true,
    lastModified: true,
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

staticRouter.use(ssrRouter);
