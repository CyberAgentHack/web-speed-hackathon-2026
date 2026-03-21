import fs from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import type { Request, Response } from "express";
import serveStatic from "serve-static";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// --- LCP image preload injection ---
const indexHtmlPath = path.resolve(CLIENT_DIST_PATH, "index.html");
let baseHtml = "";
try {
  baseHtml = fs.readFileSync(indexHtmlPath, "utf-8");
} catch {
  // index.html not yet built — will be read on first request
}

// Simple in-memory cache for home LCP image
let homeLcpCache: { imageUrl: string; expires: number } | null = null;
const HOME_LCP_TTL = 60_000; // 60 seconds

async function getHomeLcpImage(): Promise<string | null> {
  const now = Date.now();
  if (homeLcpCache && now < homeLcpCache.expires) {
    return homeLcpCache.imageUrl;
  }
  try {
    // Fetch a few posts to find one with images (some posts are text-only)
    const posts = await Post.findAll({ limit: 5 });
    for (const post of posts) {
      const images = (post as any).images;
      if (images && images.length > 0) {
        const imageUrl = `/images/optimized/${images[0].id}-1280w.webp`;
        homeLcpCache = { imageUrl, expires: now + HOME_LCP_TTL };
        return imageUrl;
      }
    }
  } catch {
    // DB not ready
  }
  return null;
}

async function getPostLcpImage(postId: string): Promise<string | null> {
  try {
    const post = await Post.findByPk(postId);
    if (post) {
      const images = (post as any).images;
      if (images && images.length > 0) {
        return `/images/optimized/${images[0].id}-1280w.webp`;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function getUserLcpImage(username: string): Promise<string | null> {
  try {
    const user = await User.findOne({ where: { username } });
    if (user) {
      const profileImage = (user as any).profileImage;
      if (profileImage) {
        return `/images/profiles/optimized/${profileImage.id}-128.webp`;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function getLcpImageForUrl(originalUrl: string): Promise<string | null> {
  // Strip query string
  const urlPath = originalUrl.split("?")[0]!;

  if (urlPath === "/" || urlPath === "") {
    return getHomeLcpImage();
  }

  const postMatch = urlPath.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    return getPostLcpImage(postMatch[1]!);
  }

  const userMatch = urlPath.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    return getUserLcpImage(userMatch[1]!);
  }

  return null;
}

function injectPreload(html: string, imageUrl: string): string {
  const preloadTag = `<link rel="preload" as="image" href="${imageUrl}" fetchpriority="high">`;
  return html.replace("</head>", `${preloadTag}</head>`);
}

// Middleware: intercept HTML requests and inject LCP preload
// history() rewrites SPA routes to /index.html, but / itself may remain as /
// We intercept both /index.html and SPA-like paths (no file extension)
staticRouter.use(async (req: Request, res: Response, next) => {
  const url = req.url.split("?")[0]!;
  // Only intercept /index.html (rewritten by history()) or / (root)
  const isSpaRoute = url === "/index.html" || url === "/";
  if (!isSpaRoute) {
    return next();
  }

  // Lazy-load HTML if not loaded at startup
  if (!baseHtml) {
    try {
      baseHtml = fs.readFileSync(indexHtmlPath, "utf-8");
    } catch {
      return next();
    }
  }

  const lcpImage = await getLcpImageForUrl(req.originalUrl);
  const html = lcpImage ? injectPreload(baseHtml, lcpImage) : baseHtml;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

// --- Cache-Control improvement ---
function getCacheControl(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  // Content-hashed chunks are immutable
  if (basename.startsWith("chunk-")) {
    return "public, max-age=31536000, immutable";
  }

  // Media files (uploads)
  if ([".jpg", ".jpeg", ".gif", ".png", ".webp", ".mp3", ".mp4", ".webm"].includes(ext)) {
    return "public, max-age=31536000, immutable";
  }

  // Fonts
  if ([".woff", ".woff2", ".ttf", ".otf", ".eot"].includes(ext)) {
    return "public, max-age=31536000, immutable";
  }

  // SVG
  if (ext === ".svg") {
    return "public, max-age=31536000, immutable";
  }

  // Default: HTML, main.js, main.css etc.
  return "no-cache";
}

const optimizedStaticOptions: Parameters<typeof serveStatic>[1] = {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    res.setHeader("Cache-Control", getCacheControl(filePath));
  },
};

staticRouter.use(serveStatic(UPLOAD_PATH, optimizedStaticOptions));
staticRouter.use(serveStatic(PUBLIC_PATH, optimizedStaticOptions));
staticRouter.use(serveStatic(CLIENT_DIST_PATH, optimizedStaticOptions));
