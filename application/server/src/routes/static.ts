import * as fs from "node:fs";
import * as path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { renderHomeTimeline } from "@web-speed-hackathon-2026/server/src/ssr/render-home";
import { renderTermsPage } from "@web-speed-hackathon-2026/server/src/ssr/render-terms";

// サーバー起動時に dist/index.html をキャッシュ
const indexHtmlPath = path.join(CLIENT_DIST_PATH, "index.html");
let indexHtmlTemplate = "";
const preloadLinkValues: string[] = [];
try {
  indexHtmlTemplate = fs.readFileSync(indexHtmlPath, "utf-8");
  const seen = new Set<string>();
  for (const m of indexHtmlTemplate.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch?.[1];
    if (href && !seen.has(href)) {
      seen.add(href);
      preloadLinkValues.push(`<${href}>; rel=preload; as=style`);
    }
  }
} catch {
  // index.html が存在しない場合（開発時等）はスキップ
}

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// ホームページ: 初期データ注入 + LCP画像プリロード
staticRouter.use(async (req, res, next) => {
  if (req.method !== "GET" || !req.url.endsWith(".html")) {
    return next();
  }

  for (const value of preloadLinkValues) {
    res.append("Link", value);
  }

  const originalUrl = req.originalUrl?.split("?")[0] || "/";

  // Terms ページ SSR: 静的コンテンツをサーバーサイドレンダリング
  if (originalUrl === "/terms" && indexHtmlTemplate) {
    try {
      const ssrHtml = renderTermsPage();
      const html = indexHtmlTemplate
        .replace("<title>CaX</title>", "<title>利用規約 - CaX</title>")
        .replace('<div id="app"></div>', `<div id="app">${ssrHtml}</div>`);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(html);
    } catch {
      // フォールバック: CSR
    }
  }

  if ((originalUrl === "/" || originalUrl === "/index.html") && indexHtmlTemplate) {
    try {
      const posts = await Post.findAll({ limit: 10, offset: 0 });
      const postsJson = JSON.stringify(posts)
        .replace(/</g, "\\u003c")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
      const dataScript = `<script>window.__INITIAL_POSTS__=${postsJson}</script>`;

      // 先頭投稿のLCP画像をpreload
      let lcpPreload = "";
      const firstPost = posts[0];
      if (firstPost) {
        const postData = firstPost.toJSON() as Record<string, unknown>;
        const images = postData["images"] as Array<{ id: string }> | undefined;
        if (images && images.length > 0) {
          const imgUrl = `/images/${encodeURIComponent(images[0]!.id)}.webp`;
          lcpPreload = `<link rel="preload" as="image" href="${imgUrl}" fetchpriority="high">`;
        }
      }

      // ホームページ軽量SSR: 先頭投稿をHTMLとしてプリレンダリング
      const postsData = posts.map((p) => p.toJSON());
      const timelineHtml = renderHomeTimeline(postsData);

      const html = indexHtmlTemplate
        .replace("</head>", `${lcpPreload}</head>`)
        .replace('<div id="app"></div>', `<div id="app">${timelineHtml}</div>`)
        .replace("</body>", `${dataScript}</body>`);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(html);
    } catch {
      // フォールバック: 通常のHTML配信
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

// 事前圧縮ファイルの配信 (.br / .gz)
// 起動時にファイル存在をキャッシュし、リクエスト時の statSync を回避
const COMPRESSIBLE_RE = /\.(js|css|svg|json)$/;
const CONTENT_TYPES: Record<string, string> = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

const compressedFileCache = new Set<string>();
function scanCompressedFiles(dir: string) {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanCompressedFiles(full);
      } else if (entry.name.endsWith(".br") || entry.name.endsWith(".gz")) {
        compressedFileCache.add(full);
      }
    }
  } catch {
    /* directory may not exist */
  }
}
scanCompressedFiles(CLIENT_DIST_PATH);

staticRouter.use((req, res, next) => {
  if (req.method !== "GET") return next();
  const ext = path.extname(req.url.split("?")[0]!);
  if (!COMPRESSIBLE_RE.test(ext)) return next();

  const accept = req.headers["accept-encoding"] || "";
  let urlPath: string;
  try {
    urlPath = decodeURIComponent(req.url.split("?")[0]!);
  } catch {
    return next();
  }
  const filePath = path.resolve(CLIENT_DIST_PATH, "." + urlPath);
  if (!filePath.startsWith(path.resolve(CLIENT_DIST_PATH))) return next();
  const contentType = CONTENT_TYPES[ext];
  const isHashed = /\.[a-f0-9]{8,}\./.test(path.basename(filePath));

  if (accept.includes("br")) {
    const brPath = filePath + ".br";
    if (compressedFileCache.has(brPath)) {
      res.setHeader("Content-Encoding", "br");
      res.setHeader("Content-Type", contentType || "application/octet-stream");
      res.setHeader("Vary", "Accept-Encoding");
      if (isHashed) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(brPath);
    }
  }

  if (accept.includes("gzip")) {
    const gzPath = filePath + ".gz";
    if (compressedFileCache.has(gzPath)) {
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Content-Type", contentType || "application/octet-stream");
      res.setHeader("Vary", "Accept-Encoding");
      if (isHashed) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(gzPath);
    }
  }

  next();
});

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (/\.[a-f0-9]{8,}\./.test(path.basename(filePath))) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);
