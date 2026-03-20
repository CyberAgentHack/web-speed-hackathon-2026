import history from "connect-history-api-fallback";
import { Router } from "express";
import path from "node:path";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const HASHED_CHUNK_RE = /[\\/]chunk-[0-9A-Za-z]+\.[^\\/]+$/;

const setImmutableCacheHeaders: serveStatic.ServeStaticOptions["setHeaders"] = (res) => {
  res.setHeader(
    "Cache-Control",
    `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable, no-transform`,
  );
};

const setRevalidationCacheHeaders: serveStatic.ServeStaticOptions["setHeaders"] = (
  res,
  filePath,
) => {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const isHtml = path.extname(filePath) === ".html";
  const isHashedChunk = HASHED_CHUNK_RE.test(normalizedPath);

  if (isHashedChunk) {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable, no-transform`,
    );
    return;
  }

  res.setHeader(
    "Cache-Control",
    isHtml
      ? "max-age=0, must-revalidate, no-transform"
      : "public, max-age=0, must-revalidate, no-transform",
  );
};

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setImmutableCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setRevalidationCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setRevalidationCacheHeaders,
  }),
);
