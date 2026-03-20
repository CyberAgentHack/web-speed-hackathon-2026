import history from "connect-history-api-fallback";
import type { Response } from "express";
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

// コンテンツハッシュを含むファイルパスかどうかを判定
function isImmutableAsset(filePath: string): boolean {
  // chunk-[contenthash].js や styles/fonts/ は長期キャッシュ可
  return /chunk-[0-9a-f]+\.js$/.test(filePath) || filePath.includes("/styles/fonts/");
}

function setImmutableCache(res: Response) {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
}

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
    setHeaders(res, filePath) {
      if (isImmutableAsset(filePath)) {
        setImmutableCache(res);
      }
    },
  }),
);
