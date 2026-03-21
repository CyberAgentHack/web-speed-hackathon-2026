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

function buildPostPreloadLinks(postData: any): string[] {
  const preloadLinks: string[] = [];

  if (postData.user?.profileImage?.id) {
    preloadLinks.push(
      `<link rel="preload" as="image" href="/images/profiles/${postData.user.profileImage.id}.jpg">`,
    );
  }

  if (postData.images?.length > 0) {
    preloadLinks.push(
      `<link rel="preload" as="image" fetchpriority="high" href="/images/optimized/${postData.images[0].id}.jpg">`,
    );
  } else if (postData.movie != null) {
    preloadLinks.push(
      `<link rel="preload" as="image" fetchpriority="high" href="/movies/posters/${postData.movie.id}.jpg">`,
    );
  }

  return preloadLinks;
}

function injectHtml(html: string, preloadLinks: string[], bodyScripts: string[] = []) {
  let injectedHtml = html;
  if (preloadLinks.length > 0) {
    injectedHtml = injectedHtml.replace("</head>", `${preloadLinks.join("\n")}\n</head>`);
  }
  if (bodyScripts.length > 0) {
    injectedHtml = injectedHtml.replace("</body>", `${bodyScripts.join("\n")}\n</body>`);
  }
  return injectedHtml;
}

// ホームページ: データ注入 + LCP画像preload
staticRouter.get("/", async (_req, res) => {
  try {
    const html = await getIndexHtml();
    const posts = await Post.findAll({ limit: 10 });
    const firstPost = posts[0];
    const preloadLinks = firstPost != null ? buildPostPreloadLinks(firstPost.toJSON() as any) : [];

    const injectedHtml = injectHtml(html, preloadLinks, [
      `<script>window.__PRELOADED_POSTS__=${JSON.stringify(posts)}</script>`,
    ]);

    res.status(200).type("html").send(injectedHtml);
  } catch {
    // フォールバック: 通常のindex.htmlを返す
    const html = await getIndexHtml();
    res.status(200).type("html").send(html);
  }
});

// 投稿詳細ページ: 投稿データ注入 + LCP画像preload
staticRouter.get("/posts/:postId", async (req, res) => {
  try {
    const html = await getIndexHtml();
    const post = await Post.findByPk(req.params.postId);
    if (post == null) {
      res.status(200).type("html").send(html);
      return;
    }

    const postJson = JSON.stringify(post);
    const preloadLinks = buildPostPreloadLinks(post.toJSON() as any);
    const injectedHtml = injectHtml(html, preloadLinks, [
      `<script>window.__PRELOADED_POST__=${postJson}</script>`,
    ]);

    res.status(200).type("html").send(injectedHtml);
  } catch {
    const html = await getIndexHtml();
    res.status(200).type("html").send(html);
  }
});

// 利用規約ページ: JSなしの純粋な静的HTMLを返す（TBT 0ms）
let termsHtmlCache: string | null = null;
async function getTermsHtml(): Promise<string> {
  if (termsHtmlCache === null) {
    const indexHtml = await getIndexHtml();
    // CSSのhrefを抽出
    const cssMatch = indexHtml.match(/<link href="([^"]+\.css)" rel="stylesheet">/);
    const cssTag = cssMatch ? cssMatch[0] : "";
    // 利用規約HTMLコンテンツを読み込み
    const termContentPath = path.resolve(
      CLIENT_DIST_PATH,
      "..",
      "client",
      "src",
      "components",
      "term",
      "term_page_content.html",
    );
    const termContent = await fs.readFile(termContentPath, "utf-8");
    termsHtmlCache = `<!doctype html><html lang="ja"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>利用規約 - CaX</title>${cssTag}</head><body class="bg-cax-canvas text-cax-text"><article class="px-2 pb-16 leading-relaxed md:px-4 md:pt-2">${termContent}</article></body></html>`;
  }
  return termsHtmlCache;
}

staticRouter.get("/terms", async (_req, res) => {
  try {
    const html = await getTermsHtml();
    res.status(200).type("html").send(html);
  } catch {
    // フォールバック: 通常のSPA index.htmlを返す
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
