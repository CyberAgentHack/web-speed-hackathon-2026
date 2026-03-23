import { existsSync, readFileSync } from "fs";
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

// ホームページ（/）のみ初期投稿データを HTML に注入して LCP を改善する。
// 最初の投稿画像を <link rel="preload"> で HTML 解析時点から取得開始し、
// window.__INITIAL_POSTS__ で API ラウンドトリップを省略する。
staticRouter.get("/", async (_req, res, next) => {
  try {
    const htmlPath = path.join(CLIENT_DIST_PATH, "index.html");
    const posts = await Post.findAll({ limit: 10, offset: 0 });
    const postsData = posts.map((p) => p.toJSON());

    // JSON-in-HTML の XSS 対策: </script> トークンを Unicode エスケープ
    const safeJson = JSON.stringify(postsData)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

    // 最初の投稿の LCP 画像 URL を決定して preload リンクを生成
    const firstPost = postsData[0] as Record<string, unknown> | undefined;
    let preloadLink = "";
    if (firstPost) {
      const images = firstPost["images"] as Array<{ id: string }> | undefined;
      const movie = firstPost["movie"] as { id: string } | undefined;
      if (images && images.length > 0 && images[0]) {
        preloadLink = `<link rel="preload" as="image" href="/images/${images[0].id}.webp" fetchpriority="high">`;
      } else if (movie) {
        preloadLink = `<link rel="preload" as="image" href="/movies/${movie.id}.poster.webp" fetchpriority="high">`;
      }
    }

    let html = readFileSync(htmlPath, "utf-8");
    // 既存の static preload を実際の LCP 要素の preload で差し替え（ホームページ専用）
    if (preloadLink) {
      html = html.replace(/<link rel="preload" as="image"[^>]*>/, preloadLink);
    }
    // 初期データをスクリプトとして </head> 直前に注入
    html = html.replace("</head>", `  <script>window.__INITIAL_POSTS__=${safeJson};</script>\n  </head>`);

    res.type("html").send(html);
  } catch {
    next();
  }
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
