import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import serveStatic from "serve-static";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { DEFAULT_PROFILE_IMAGE_ID } from "@web-speed-hackathon-2026/server/src/models/User";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();
const HOME_PRELOAD_POST_LIMIT = 5;
const llFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getProfileImagePath(postData: any): string {
  const profileImageId = postData.user?.profileImage?.id ?? DEFAULT_PROFILE_IMAGE_ID;
  return `/images/profiles/${profileImageId}.jpg`;
}

function renderCriticalMedia(postData: any): string {
  if (postData.images?.length > 0) {
    const imageMarkup = postData.images
      .map((image: any, index: number) => {
        const colSpan = postData.images.length === 1 ? "col-span-2" : "col-span-1";
        const rowSpan =
          postData.images.length <= 2 || (postData.images.length === 3 && index === 0)
            ? "row-span-2"
            : "row-span-1";

        return `<div class="bg-cax-surface-subtle ${colSpan} ${rowSpan}"><img alt="${escapeHtml(image.alt ?? "")}" class="absolute inset-0 h-full w-full object-cover" decoding="async" fetchpriority="${index === 0 ? "high" : "auto"}" loading="${index === 0 ? "eager" : "lazy"}" src="/images/optimized/${image.id}.jpg"></div>`;
      })
      .join("");

    return `<div class="relative mt-2 w-full"><div class="relative w-full" style="aspect-ratio:16 / 9"><div class="absolute inset-0"><div class="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">${imageMarkup}</div></div></div></div>`;
  }

  if (postData.movie != null) {
    return `<div class="relative mt-2 w-full"><div class="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border" data-movie-area><div class="relative w-full" style="aspect-ratio:1 / 1"><div class="absolute inset-0"><div aria-label="動画プレイヤー" class="group relative block h-full w-full"><img alt="" class="h-full w-full object-cover" decoding="async" fetchpriority="high" loading="eager" src="/movies/posters/${postData.movie.id}.jpg"></div></div></div></div></div>`;
  }

  if (postData.sound != null) {
    return `<div class="relative mt-2 w-full"><div class="border-cax-border relative h-full w-full overflow-hidden rounded-lg border" data-sound-area><div class="bg-cax-surface-subtle flex h-full w-full items-center justify-center p-4"><div class="text-sm font-bold">${escapeHtml(postData.sound.title ?? "")}</div></div></div></div>`;
  }

  return "";
}

function renderCriticalTimelineItem(postData: any): string {
  return `<section><article class="hover:bg-cax-surface-subtle px-1 sm:px-4"><div class="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4"><div class="shrink-0 grow-0 pr-2 sm:pr-4"><a class="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border sm:h-16 sm:w-16" href="/users/${encodeURIComponent(postData.user.username)}"><img alt="${escapeHtml(postData.user.profileImage?.alt ?? "")}" decoding="async" fetchpriority="auto" loading="lazy" src="${getProfileImagePath(postData)}"></a></div><div class="min-w-0 shrink grow"><p class="overflow-hidden text-sm text-ellipsis whitespace-nowrap"><a class="text-cax-text pr-1 font-bold" href="/users/${encodeURIComponent(postData.user.username)}">${escapeHtml(postData.user.name)}</a><a class="text-cax-text-muted pr-1" href="/users/${encodeURIComponent(postData.user.username)}">@${escapeHtml(postData.user.username)}</a><span class="text-cax-text-muted pr-1">-</span><a class="text-cax-text-muted pr-1" href="/posts/${postData.id}"><time datetime="${new Date(postData.createdAt).toISOString()}">${escapeHtml(llFormatter.format(new Date(postData.createdAt)))}</time></a></p><div class="text-cax-text leading-relaxed"><p>${escapeHtml(postData.text)}</p></div>${renderCriticalMedia(postData)}</div></div></article></section>`;
}

function renderCriticalHomeShell(firstPost: any): string {
  return `<div class="relative z-0 flex justify-center font-sans" data-critical-home=""><div class="bg-cax-surface text-cax-text flex min-h-screen max-w-full"><aside class="relative z-10"><nav aria-hidden="true" class="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r"></nav></aside><main class="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0">${renderCriticalTimelineItem(firstPost)}</main></div></div>`;
}

function injectHtml(
  html: string,
  preloadLinks: string[],
  bodyScripts: string[] = [],
  appHtml?: string,
) {
  let injectedHtml = html;
  if (preloadLinks.length > 0) {
    injectedHtml = injectedHtml.replace("</head>", `${preloadLinks.join("\n")}\n</head>`);
  }
  if (appHtml != null) {
    injectedHtml = injectedHtml.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`);
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
    const posts = await Post.findAll({ limit: HOME_PRELOAD_POST_LIMIT });
    const firstPost = posts[0];
    const preloadLinks = firstPost != null ? buildPostPreloadLinks(firstPost.toJSON() as any) : [];
    const appHtml =
      firstPost != null ? renderCriticalHomeShell(firstPost.toJSON() as any) : undefined;

    const injectedHtml = injectHtml(
      html,
      preloadLinks,
      [`<script>window.__PRELOADED_POSTS__=${JSON.stringify(posts)}</script>`],
      appHtml,
    );

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
