import type { Response } from "express";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const YEAR_IN_SECONDS = 31536000;

function setDistCache(_res: unknown, filePath: string) {
  const res = _res as Response;
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
  } else {
    res.setHeader("Cache-Control", `public, max-age=${YEAR_IN_SECONDS}, immutable`);
  }
}

function setPublicAssetCache(_res: unknown, _filePath: string) {
  const res = _res as Response;
  res.setHeader("Cache-Control", `public, max-age=${YEAR_IN_SECONDS}, immutable`);
}

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setPublicAssetCache,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setPublicAssetCache,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setDistCache,
  }),
);
