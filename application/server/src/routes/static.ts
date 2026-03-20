import history from "connect-history-api-fallback";
import path from "path";
import { Router } from "express";
import type { Response } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function setCacheControl(res: Response, value: string) {
  res.setHeader("Cache-Control", value);
}

function setDistCacheHeaders(res: Response, filePath: string) {
  const relativePath = path.relative(CLIENT_DIST_PATH, filePath);
  const fileName = path.basename(filePath);
  const isHashedAsset = /(?:^chunk-|-[0-9a-f]{8,}\.)/.test(fileName);

  if (relativePath === "index.html") {
    setCacheControl(res, "no-cache, no-transform");
    return;
  }

  if (isHashedAsset) {
    setCacheControl(res, `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable, no-transform`);
    return;
  }

  setCacheControl(res, "public, max-age=0, must-revalidate, no-transform");
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    immutable: true,
    maxAge: ONE_YEAR_IN_SECONDS * 1000,
    setHeaders: (res) => {
      setCacheControl(res, `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable, no-transform`);
    },
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    maxAge: ONE_DAY_IN_SECONDS * 1000,
    setHeaders: (res) => {
      setCacheControl(res, `public, max-age=${ONE_DAY_IN_SECONDS}, no-transform`);
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setDistCacheHeaders,
  }),
);
