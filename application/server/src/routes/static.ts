import history from "connect-history-api-fallback";
import type { Stats } from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();
const HASHED_ASSET_PATTERN = /(?:^|[.-])[0-9a-f]{8,}\.(?:css|js)$/i;
const MEDIA_ASSET_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp|mp3|wav|ogg|m4a|mp4|webm)$/i;
const LONG_CACHE_CONTROL = "public, max-age=31536000, immutable";

const setMediaCacheControl = (res: ServerResponse, filePath: string, _stat: Stats) => {
  const fileName = path.basename(filePath);

  if (MEDIA_ASSET_PATTERN.test(fileName)) {
    res.setHeader("Cache-Control", LONG_CACHE_CONTROL);
  }
};

const setClientDistCacheControl = (res: ServerResponse, filePath: string, _stat: Stats) => {
  const fileName = path.basename(filePath);

  if (fileName === "index.html") {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  if (HASHED_ASSET_PATTERN.test(fileName)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
};

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setMediaCacheControl,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setMediaCacheControl,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: setClientDistCacheControl,
  }),
);
