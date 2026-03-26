import history from "connect-history-api-fallback";
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

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    // ユーザーアップロードの画像/音声/動画は id で不変なので長期キャッシュします
    maxAge: 31536000,
    setHeaders: (res, filePath) => {
      // filePath は mount 直下の相対パスになるため、先頭の '/' を無視して判定します
      const p = filePath.replace(/^\/+/, "");
      if (p.startsWith("images/") || p.startsWith("movies/") || p.startsWith("sounds/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: 0,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: 0,
  }),
);
