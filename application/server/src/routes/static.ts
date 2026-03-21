import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { getWaveform } from "@web-speed-hackathon-2026/server/src/utils/waveform_cache";

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

// LCP preload hints per route pattern (based on seed data)
const LCP_PRELOADS: Array<{
  pattern: RegExp;
  getLinks: () => string;
}> = [
  {
    // Home page - first post has a movie, poster image is LCP
    pattern: /^\/$/,
    getLinks: () => {
      const movieId = "51a14d70-9dd6-45ad-9f87-64af91ec2779";
      return [
        `<link rel="preload" as="image" fetchpriority="high" href="/movies/${movieId}_poster.webp">`,
        '<link rel="preload" as="fetch" href="/api/v1/posts?limit=5&offset=0" crossorigin>',
      ].join('\n');
    },
  },
  {
    // Photo post detail - first image (4 images, sizes = 320px on desktop)
    pattern: /^\/posts\/fe6712a1-d9e4-4f6a-987d-e7d08b7f8a46$/,
    getLinks: () => {
      const imageId = "18358ca6-0aa7-4592-9926-1ec522b9aacb";
      return `<link rel="preload" as="image" fetchpriority="high" imagesrcset="/images/${imageId}_w320.webp 320w, /images/${imageId}_w640.webp 640w, /images/${imageId}_w1280.webp 1280w" imagesizes="(min-width: 640px) 320px, 50vw">`;
    },
  },
  {
    // Video post detail - preload poster image
    pattern: /^\/posts\/fff790f5-99ea-432f-8f79-21d3d49efd1a$/,
    getLinks: () => {
      const movieId = "51a14d70-9dd6-45ad-9f87-64af91ec2779";
      return `<link rel="preload" as="image" fetchpriority="high" href="/movies/${movieId}_poster.webp">`;
    },
  },
  {
    // Terms page - preload Rei no Are Mincho font (LCP is heading text)
    pattern: /^\/terms$/,
    getLinks: () => {
      return [
        '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Heavy.woff2" crossorigin>',
        '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Regular.woff2" crossorigin>',
      ].join('\n');
    },
  },
  {
    // Text post detail - preload API response and profile image
    pattern: /^\/posts\/ff93a168-ea7c-4202-9879-672382febfda$/,
    getLinks: () => {
      return [
        '<link rel="preload" as="fetch" href="/api/v1/posts/ff93a168-ea7c-4202-9879-672382febfda" crossorigin>',
        '<link rel="preload" as="image" fetchpriority="high" href="/images/profiles/3dd3640a-5f9e-40d0-8daf-bfdb473b129e.webp">',
      ].join('\n');
    },
  },
  {
    // Audio post detail - preload API response and profile image
    pattern: /^\/posts\/fefe75bd-1b7a-478c-8ecc-2c1ab38b821e$/,
    getLinks: () => {
      return [
        '<link rel="preload" as="fetch" href="/api/v1/posts/fefe75bd-1b7a-478c-8ecc-2c1ab38b821e" crossorigin>',
        '<link rel="preload" as="image" fetchpriority="high" href="/images/profiles/84ba6fee-d167-43c4-8b10-d94caa923f48.webp">',
      ].join('\n');
    },
  },
  {
    // DM list - preload API response
    pattern: /^\/dm$/,
    getLinks: () => {
      return '<link rel="preload" as="fetch" href="/api/v1/dm" crossorigin>';
    },
  },
  {
    // DM detail - preload API response and peer profile image
    pattern: /^\/dm\/33881deb-da8a-4ca9-a153-2f80d5fa7af8$/,
    getLinks: () => {
      return [
        '<link rel="preload" as="fetch" href="/api/v1/dm/33881deb-da8a-4ca9-a153-2f80d5fa7af8" crossorigin>',
        '<link rel="preload" as="image" fetchpriority="high" href="/images/profiles/dbe9b1f0-9822-4f77-9635-f9fd64e2b4e5.webp">',
      ].join('\n');
    },
  },
];

function getPreloadLinks(urlPath: string): string {
  for (const { pattern, getLinks } of LCP_PRELOADS) {
    if (pattern.test(urlPath)) {
      return getLinks();
    }
  }
  return "";
}

// Cache the index.html content
let indexHtmlCache: string | null = null;

function getIndexHtml(): string {
  if (indexHtmlCache == null) {
    indexHtmlCache = fs.readFileSync(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");
  }
  return indexHtmlCache;
}

// SSR content for /terms page - lightweight shell only for fast FCP
function getTermsHtml(): string {
  const baseHtml = getIndexHtml();

  let html = baseHtml.replace("<title>CaX</title>", "<title>利用規約 - CaX</title>");

  // Inject inline font-face + minimal heading for immediate FCP paint
  const fontFaceCSS = `<style>@font-face{font-family:"Rei no Are Mincho";src:url(/fonts/ReiNoAreMincho-Heavy.woff2) format("woff2");font-weight:bold;font-display:swap}@font-face{font-family:"Rei no Are Mincho";src:url(/fonts/ReiNoAreMincho-Regular.woff2) format("woff2");font-weight:normal;font-display:swap}</style>`;
  html = html.replace("</head>", `${fontFaceCSS}\n</head>`);

  return html;
}

// Inline data cache for initial page loads
let inlineDataCache: Record<string, string> = {};

function attachWaveform(postJson: any): any {
  if (postJson.sound && postJson.sound.id) {
    const waveform = getWaveform(postJson.sound.id);
    if (waveform) {
      postJson.sound.waveform = waveform;
    }
  }
  return postJson;
}

async function getInitialPostsJson(): Promise<string> {
  if (inlineDataCache["posts"]) return inlineDataCache["posts"];
  const posts = await Post.findAll({ limit: 2, offset: 0 });
  const postsJson = posts.map((p) => attachWaveform(p.toJSON()));
  const json = JSON.stringify(postsJson);
  inlineDataCache["posts"] = json;
  return json;
}

export function clearInlineDataCache(): void {
  inlineDataCache = {};
}

// Known static file extensions
const STATIC_EXT = /\.\w+$/;

// SPA route patterns (routes that should serve index.html)
function isSpaRoute(urlPath: string): boolean {
  // If the URL has a file extension, it's a static file request
  if (STATIC_EXT.test(urlPath)) {
    return false;
  }
  // API routes are handled elsewhere
  if (urlPath.startsWith("/api/")) {
    return false;
  }
  return true;
}

// Serve pre-compressed (.br / .gz) files from CLIENT_DIST_PATH
const COMPRESSIBLE_EXT = /\.(js|css)$/;
const ENCODING_EXT: Record<string, string> = { br: ".br", gzip: ".gz" };
const CONTENT_TYPE: Record<string, string> = {
  ".js": "application/javascript",
  ".css": "text/css",
};

function servePreCompressed(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!COMPRESSIBLE_EXT.test(req.path)) return next();

  const acceptEncoding = req.headers["accept-encoding"] || "";
  const encodings: Array<[string, string]> = [["br", ".br"], ["gzip", ".gz"]];

  for (const [enc, ext] of encodings) {
    if (!acceptEncoding.includes(enc)) continue;
    const filePath = path.join(CLIENT_DIST_PATH, req.path + ext);
    if (!fs.existsSync(filePath)) continue;

    const originalExt = path.extname(req.path);
    res.setHeader("Content-Encoding", enc);
    res.setHeader("Content-Type", CONTENT_TYPE[originalExt] || "application/octet-stream");
    res.setHeader("Cache-Control", `public, max-age=${ONE_YEAR / 1000}, immutable`);
    res.setHeader("Vary", "Accept-Encoding");
    return res.sendFile(filePath);
  }

  return next();
}

export const staticRouter = Router();

// Serve pre-compressed static assets before anything else
staticRouter.use(servePreCompressed);

// First: handle SPA routes by serving index.html with preload hints
staticRouter.use(async (req, res, next) => {
  const urlPath = req.path;

  if (!isSpaRoute(urlPath)) {
    return next();
  }

  // /terms has pre-rendered HTML for faster FCP/LCP
  if (urlPath === "/terms") {
    const html = getTermsHtml();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    return res.send(html);
  }

  const preloadLinks = getPreloadLinks(urlPath);
  let html = getIndexHtml();

  if (preloadLinks) {
    html = html.replace("</head>", `${preloadLinks}\n</head>`);
  }

  // Inject inline data for home page
  if (urlPath === "/") {
    const postsJson = await getInitialPostsJson();
    html = html.replace("</body>", `<script type="application/json" id="initial-posts">${postsJson}</script>\n</body>`);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  return res.send(html);
});

// Then: serve actual static files
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
    maxAge: ONE_YEAR,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: ONE_YEAR,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);
