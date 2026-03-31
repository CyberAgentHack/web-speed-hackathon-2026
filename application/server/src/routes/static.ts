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

// アップロード画像はキャッシュ有効化（頻繁に変わらないため）
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1d", // 1日キャッシュ（画像は更新頻度が低い）
    cacheControl: true,
  }),
);

// 公開フォルダ（フォントなど）もキャッシュ有効化
staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "7d", // 7日キャッシュ（フォントは滅多に変わらない）
    cacheControl: true,
  }),
);

// JS/CSS/画像に長期キャッシュを設定
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y", // contentHash付きファイルは1年キャッシュ
    immutable: true,
  }),
);
