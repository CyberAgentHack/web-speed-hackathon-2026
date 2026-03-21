import { promises as fs } from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// ホーム画面のLCP改善: 最初の動画投稿のposter画像をpreload
let cachedIndexHtml: string | null = null;

staticRouter.get("/", async (_req, res, next) => {
  try {
    if (!cachedIndexHtml) {
      cachedIndexHtml = await fs.readFile(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");
    }

    const firstMoviePost = await Post.findOne({
      order: [["id", "DESC"]],
    });

    const movie = (firstMoviePost as any)?.movie;

    if (movie) {
      const preloadTag = `<link rel="preload" as="image" href="/movies/posters/${movie.id}.webp" fetchpriority="high">`;
      const html = cachedIndexHtml.replace("</head>", `${preloadTag}\n</head>`);
      res.type("html").send(html);
    } else {
      res.type("html").send(cachedIndexHtml);
    }
  } catch {
    next();
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, { maxAge: '1d' }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH),
);
