import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const ONE_HOUR_SECONDS = 60 * 60;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const HASHED_ASSET_PATTERN = /\.[0-9a-f]{8,}\./i;

function setCacheHeaders(res: Parameters<NonNullable<Parameters<typeof serveStatic>[1]>["setHeaders"]>[0], filePath: string) {
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  if (HASHED_ASSET_PATTERN.test(filePath)) {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
    );
    return;
  }

  res.setHeader("Cache-Control", `public, max-age=${ONE_HOUR_SECONDS}`);
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setCacheHeaders,
  }),
);
