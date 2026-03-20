import path from "node:path";

import history from "connect-history-api-fallback";
import type { Response } from "express";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { createImageOptimizeMiddleware } from "@web-speed-hackathon-2026/server/src/routes/image_optimize";

/** ビルド成果物の Cache-Control（エントリはファイル名固定のため再検証、ハッシュ付きは長期） */
function setClientDistCacheHeaders(res: Response, filePath: string): void {
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  const rel = path.relative(CLIENT_DIST_PATH, filePath).replaceAll("\\", "/");
  const base = path.basename(filePath);

  // webpack の async chunk（ファイル名に contenthash）
  if (/^chunk-[0-9a-f]+\.js$/i.test(base)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  // asset/resource の [contenthash] 付き（wasm 等）
  if (/[0-9a-f]{8,}\.(js|css|mjs|cjs|wasm|woff2?|ttf|otf)$/i.test(base)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  // KaTeX フォント（パス固定・中身はほぼ不変）
  if (rel.startsWith("styles/fonts/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  // main.js / main.css / runtime 等（デプロイで中身だけ変わる URL）
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
}

export const staticRouter = Router();

// 画像を Sharp で最適化して配信（JPEG resize 1200px + mozjpeg q80）
staticRouter.use(createImageOptimizeMiddleware([UPLOAD_PATH, PUBLIC_PATH]));

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res) {
      // ID 単位のメディア（同一 URL で上書きされうるため immutable は付けない）
      res.setHeader(
        "Cache-Control",
        "public, max-age=86400, stale-while-revalidate=604800",
      );
    },
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res) {
      // シードの profiles / icons 等（URL とファイルが対応したまま）
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      setClientDistCacheHeaders(res, filePath);
    },
  }),
);
