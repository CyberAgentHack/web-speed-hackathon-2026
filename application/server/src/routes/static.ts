import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import serveStatic from "serve-static";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// 静的ファイル配信（ファイルが存在する場合はここで返る）
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "7d",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "7d",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    index: false,
    lastModified: true,
    setHeaders(res, filePath) {
      // Hash-named JS/CSS files get immutable long cache
      if (/-[a-f0-9]{16,}\.(js|css)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  }),
);

// index.html テンプレートをキャッシュ
let indexHtmlCache: string | null = null;
async function getIndexHtml(): Promise<string> {
  if (indexHtmlCache === null) {
    indexHtmlCache = await fs.readFile(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");
  }
  return indexHtmlCache;
}

// ホームページ: データ注入 + LCP画像preload
staticRouter.get("/", async (_req, res) => {
  try {
    const html = await getIndexHtml();
    const posts = await Post.findAll({ limit: 10 });
    const postsJson = JSON.stringify(posts);

    // 最初の投稿からLCP画像URLを特定
    const preloadLinks: string[] = [];
    const firstPost = posts[0];
    if (firstPost != null) {
      const postData = firstPost.toJSON() as any;

      // プロフィール画像
      if (postData.user?.profileImage?.id) {
        preloadLinks.push(
          `<link rel="preload" as="image" href="/images/profiles/${postData.user.profileImage.id}.jpg">`,
        );
      }

      // 投稿画像（LCP候補）
      if (postData.images?.length > 0) {
        preloadLinks.push(
          `<link rel="preload" as="image" fetchpriority="high" href="/images/optimized/${postData.images[0].id}.jpg">`,
        );
      } else if (postData.movie != null) {
        // 動画ポスター（LCP候補）
        preloadLinks.push(
          `<link rel="preload" as="image" fetchpriority="high" href="/movies/posters/${postData.movie.id}.jpg">`,
        );
      }
    }

    // HTML注入
    let injectedHtml = html;
    if (preloadLinks.length > 0) {
      injectedHtml = injectedHtml.replace("</head>", `${preloadLinks.join("\n")}\n</head>`);
    }
    injectedHtml = injectedHtml.replace(
      "</body>",
      `<script>window.__PRELOADED_POSTS__=${postsJson}</script>\n</body>`,
    );

    res.status(200).type("html").send(injectedHtml);
  } catch {
    // フォールバック: 通常のindex.htmlを返す
    const html = await getIndexHtml();
    res.status(200).type("html").send(html);
  }
});

// その他のSPAルート: index.htmlをそのまま返す
staticRouter.use(async (req, res, next) => {
  // APIやファイルリクエストはスキップ（静的ファイルは上のserveStaticで処理済み）
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    return next();
  }

  try {
    const html = await getIndexHtml();
    res.status(200).type("html").send(html);
  } catch {
    next();
  }
});
