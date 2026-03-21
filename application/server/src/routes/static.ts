import { promises as fs } from "fs";
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
const MOVIE_EXTENSIONS = ["webm", "mp4", "gif"] as const;

staticRouter.get("/movies/:movieId", async (req, res, next) => {
  try {
    const movieId = req.params["movieId"];
    if (movieId === undefined || movieId === "") {
      return next();
    }

    const roots = [UPLOAD_PATH, PUBLIC_PATH];
    for (const root of roots) {
      for (const extension of MOVIE_EXTENSIONS) {
        const filePath = path.resolve(root, `./movies/${movieId}.${extension}`);
        try {
          await fs.access(filePath);
          return res.sendFile(filePath);
        } catch {
          // 次の拡張子を確認します
        }
      }
    }
  } catch (err) {
    return next(err);
  }
  return res.status(404).end();
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

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
  }),
);
