import fs from "node:fs/promises";
import path from "node:path";
import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { Post, Image } from "@web-speed-hackathon-2026/server/src/models";

export const staticRouter = Router();

// アップロードされたファイル（画像・動画等）
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);

// 公開静的ファイル（事前リサイズ画像等）
staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history() as any);

staticRouter.get(["/", "/index.html"], async (req, res, next) => {
  if (req.path === "/" || req.path === "/index.html") {
    try {
      let indexHtml = await fs.readFile(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");
      
      const firstPost = (await Post.findOne({
        order: [["createdAt", "DESC"]],
        include: [{ model: Image, as: "images" }]
      })) as any;

      if (firstPost && firstPost.images && firstPost.images.length > 0) {
        const firstImageId = firstPost.images[0].id;
        const preloadLink = `<link rel="preload" as="image" href="/images/${firstImageId}_w200.avif" fetchpriority="high">`;
        indexHtml = indexHtml.replace("</head>", `  ${preloadLink}\n  </head>`);
      }

      res.send(indexHtml);
      return;
    } catch {}
  }
  next();
});

// クライアントビルド成果物（JS/CSS/HTML）
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);
