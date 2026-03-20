import history from "connect-history-api-fallback";
import { Router } from "express";
import path from "path";
import serveStatic, { ServeStaticOptions } from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const LONG_CACHE_HEADER = "public, max-age=31536000, immutable";
const REVALIDATE_CACHE_HEADER = "public, max-age=0, must-revalidate";
const HASHED_CHUNK_PATTERN = /(?:^|\/)chunk-[0-9a-f]{16,}\.[^.]+$/i;
const UUID_ASSET_PATTERN =
  /(?:^|\/)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[^.]+$/i;
type SetHeaders = NonNullable<ServeStaticOptions["setHeaders"]>;

const setStaticCacheHeader = (rootPath: string) => {
  const setHeaders: SetHeaders = (res, filePath) => {
    const relativePath = path.relative(rootPath, filePath).replaceAll(path.sep, "/");

    if (relativePath === "index.html") {
      res.setHeader("Cache-Control", REVALIDATE_CACHE_HEADER);
      return;
    }

    if (rootPath === UPLOAD_PATH || HASHED_CHUNK_PATTERN.test(relativePath) || UUID_ASSET_PATTERN.test(relativePath)) {
      res.setHeader("Cache-Control", LONG_CACHE_HEADER);
      return;
    }

    res.setHeader("Cache-Control", REVALIDATE_CACHE_HEADER);
  };

  return setHeaders;
};

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: setStaticCacheHeader(UPLOAD_PATH),
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: setStaticCacheHeader(PUBLIC_PATH),
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setStaticCacheHeader(CLIENT_DIST_PATH),
  }),
);
