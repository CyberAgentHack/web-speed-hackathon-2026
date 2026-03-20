import { existsSync } from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// .webp/.mp4 が見つからない場合、.jpg/.gif にフォールバック（アップロードファイル対応）
staticRouter.use((req, _res, next) => {
  if (req.path.endsWith(".webp") || req.path.endsWith(".mp4")) {
    const inUpload = path.join(UPLOAD_PATH, req.path);
    const inPublic = path.join(PUBLIC_PATH, req.path);
    if (!existsSync(inUpload) && !existsSync(inPublic)) {
      const fallback = req.path.replace(/\.webp$/, ".jpg").replace(/\.mp4$/, ".gif");
      const fallbackInUpload = path.join(UPLOAD_PATH, fallback);
      if (existsSync(fallbackInUpload)) {
        req.url = fallback;
      }
    }
  }
  next();
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

const staticOpts = {
  etag: true,
  lastModified: true,
  maxAge: "7d",
  immutable: true,
} as const;

staticRouter.use(serveStatic(UPLOAD_PATH, staticOpts));
staticRouter.use(serveStatic(PUBLIC_PATH, staticOpts));
staticRouter.use(serveStatic(CLIENT_DIST_PATH, staticOpts));
