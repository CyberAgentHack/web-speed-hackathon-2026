import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { imageServeRouter } from "@web-speed-hackathon-2026/server/src/routes/image_serve";

export const staticRouter = Router();

// 画像配信は history fallback より前に処理
staticRouter.use(imageServeRouter);

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

const setMp4ContentType: serveStatic.ServeStaticOptions["setHeaders"] = (res, filePath) => {
  if (filePath.endsWith(".mp4")) {
    res.setHeader("Content-Type", "video/mp4");
  }
};

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setMp4ContentType,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setMp4ContentType,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
  }),
);
