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

// アップロードファイル（UUID アドレッサブル: 変更なし）
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

// 公開静的ファイル（フォント・画像・動画・音声 等）
staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

// クライアントビルド成果物
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("/index.html") || filePath.endsWith("\\index.html")) {
        // index.html は毎回検証（SPA エントリポイントのため）
        res.setHeader("Cache-Control", "no-cache");
      } else {
        // JS/CSS/フォント等: コンテンツハッシュ付きのため変更不可
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);
