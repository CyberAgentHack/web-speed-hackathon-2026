import { promises as fs } from "fs";
import history from "connect-history-api-fallback";
import { Router } from "express";
import path from "path";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// 画像ファイルのフォールバック対応：.webp が存在しない場合は .jpg を返す
staticRouter.use(async (req, res, next) => {
  const imageMatch = req.path.match(/^\/images\/(.+)\.webp$/) || req.path.match(/^\/images\/profiles\/(.+)\.webp$/);
  if (imageMatch) {
    const isProfile = req.path.includes("/profiles/");
    const id = imageMatch[1];
    const basePath = isProfile ? "images/profiles" : "images";
    const jpgPath = path.join(UPLOAD_PATH, `${basePath}/${id}.jpg`);
    try {
      await fs.access(jpgPath);
      return res.sendFile(jpgPath);
    } catch {
      // .jpg が存在しない場合は通常の処理に続ける
    }
  }
  next();
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
  }),
);
