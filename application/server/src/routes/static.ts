import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";
import path from "node:path";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

function setStaticCacheControl(
  res: Parameters<NonNullable<serveStatic.ServeStaticOptions["setHeaders"]>>[0],
  filePath: string,
) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  if (basename === "index.html") {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return;
  }

  if (/^chunk-[0-9a-f]+\.js(?:\.LICENSE\.txt)?$/.test(basename)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  if (filePath.startsWith(UPLOAD_PATH)) {
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mp3", ".wav"].includes(ext)) {
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      return;
    }
  }

  if (filePath.startsWith(PUBLIC_PATH) || filePath.startsWith(CLIENT_DIST_PATH)) {
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".webm", ".woff", ".woff2", ".ttf"].includes(ext)) {
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      return;
    }
  }

  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: setStaticCacheControl,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: setStaticCacheControl,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setStaticCacheControl,
  }),
);
