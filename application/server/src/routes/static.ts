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

// アップロードファイル（UUID ベースのパスで内容は不変）
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  }),
);

// 公開アセット（フォント等、変更頻度低）
staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  }),
);

// Webpack ビルド成果物
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) {
        // SPA エントリー: 常に最新を取得
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.[0-9a-f]{8,}\.(js|css)$/.test(filePath)) {
        // contenthash 付きアセット: 1年間キャッシュ
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        // KaTeX フォント等のコピーファイル
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  }),
);
