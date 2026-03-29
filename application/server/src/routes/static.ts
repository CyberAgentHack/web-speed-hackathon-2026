import history from "connect-history-api-fallback";
import path from "node:path";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const ONE_YEAR_SECONDS = 31536000;
const FINGERPRINTED_ASSET_RE = /(?:^|[.-])[0-9a-f]{8,}(?:[.-]|$)/i;

const applyLongCacheForFingerprintedAssets: serveStatic.ServeStaticOptions["setHeaders"] = (
  res,
  filePath,
) => {
  const fileName = path.basename(filePath);
  if (!FINGERPRINTED_ASSET_RE.test(fileName)) {
    return;
  }

  res.setHeader("Cache-Control", `public, max-age=${ONE_YEAR_SECONDS}, immutable`);
};

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: 0,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1h",
    setHeaders: applyLongCacheForFingerprintedAssets,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1h",
    setHeaders: applyLongCacheForFingerprintedAssets,
  }),
);
