import fs from "node:fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";
import sharp from "sharp";

import { cache, TTL } from "@web-speed-hackathon-2026/server/src/cache";
import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { resolveMediaPath } from "@web-speed-hackathon-2026/server/src/utils/media_derivation";

export const staticRouter = Router();

// In-memory cache for Sharp-transformed images (keyed by path|w|h|format)
const transformedImageCache = new Map<string, Buffer>();
const TRANSFORMED_IMAGE_CACHE_MAX = 500;
const IMAGE_MEDIA_PATH = /^\/images\/.+\.(jpg|webp|avif)$/i;
const MOVIE_MEDIA_PATH = /^\/movies\/.+\.(mp4|webm)$/i;
const SOUND_MEDIA_PATH = /^\/sounds\/.+\.(mp3|ogg)$/i;

// ── Bootstrap injection ──────────────────────────────────────────────
let baseHtml = "";
try {
  baseHtml = fs.readFileSync(path.join(CLIENT_DIST_PATH, "index.html"), "utf8");
} catch {
  // populated after client build
}
const termsHtml = baseHtml.replace(
  "</head>",
  [
    '<link rel="preload" href="/fonts/ReiNoAreMincho-Regular-Subset.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/fonts/ReiNoAreMincho-Heavy-Subset.woff2" as="font" type="font/woff2" crossorigin>',
    "</head>",
  ].join(""),
);

const POST_DETAIL_ROUTE = /^\/posts\/([a-f0-9-]{36})$/;
// Keep this aligned with TimelineContainer's first-page limit.
const BOOTSTRAP_LIMIT = 15;

function serializeBootstrap(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

const htmlSnapshotCache = new Map<string, string>();

export function clearHtmlCache() {
  htmlSnapshotCache.clear();
}

async function buildInjectedHtml(reqPath: string): Promise<string | null> {
  const bootstrapData: Record<string, unknown> = {};

  try {
    if (reqPath === "/") {
      const cacheKey = `posts:${BOOTSTRAP_LIMIT}:0`;
      let posts = cache.get<Post[]>(cacheKey);
      if (posts === undefined) {
        posts = await Post.findAll({ limit: BOOTSTRAP_LIMIT, offset: 0 });
        cache.set(cacheKey, posts, TTL.POST);
      }
      bootstrapData[`/api/v1/posts?limit=${BOOTSTRAP_LIMIT}&offset=0`] = JSON.parse(JSON.stringify(posts));
    }

    const postMatch = reqPath.match(POST_DETAIL_ROUTE);
    if (postMatch) {
      const postId = postMatch[1]!;
      const cacheKey = `post:${postId}`;
      let post = cache.get<Post>(cacheKey);
      if (post === undefined) {
        post = (await Post.findByPk(postId)) ?? undefined;
        if (post !== undefined) {
          cache.set(cacheKey, post, TTL.POST);
        }
      }
      if (post !== undefined) {
        bootstrapData[`/api/v1/posts/${postId}`] = JSON.parse(JSON.stringify(post));
      }
    }
  } catch {
    // fall back to non-bootstrapped HTML
  }

  if (Object.keys(bootstrapData).length === 0) {
    return null;
  }

  const scriptTag = `<script>window.__CAX_BOOTSTRAP__=${serializeBootstrap(bootstrapData)}</script>`;
  return baseHtml.replace("</head>", `${scriptTag}</head>`);
}

// Serve bootstrapped HTML for SPA routes BEFORE history fallback
staticRouter.use(async (req, res, next) => {
  if (!baseHtml || req.method !== "GET") return next();

  const lastSegment = req.path.split("/").pop() || "";
  if (lastSegment.includes(".") || req.path.startsWith("/api/")) return next();

  if (req.path !== "/" && !POST_DETAIL_ROUTE.test(req.path)) {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "no-cache");
    if (req.path === "/terms") {
      return res.send(termsHtml);
    }
    return res.send(baseHtml);
  }

  let html = htmlSnapshotCache.get(req.path);
  if (!html) {
    html = (await buildInjectedHtml(req.path)) ?? baseHtml;
    if (html !== baseHtml) {
      htmlSnapshotCache.set(req.path, html);
    }
  }

  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

async function resolveImagePath(relativePath: string): Promise<string | undefined> {
  return resolveMediaPath(relativePath, "images");
}

staticRouter.use(async (req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    return next();
  }

  const relativePath = req.path.replace(/^\/+/, "");
  if (!IMAGE_MEDIA_PATH.test(req.path)) {
    return next();
  }

  const qw = parseInt(req.query["w"] as string, 10);
  const qh = parseInt(req.query["h"] as string, 10);
  const width = Number.isFinite(qw) && qw > 0 ? qw : undefined;
  const height = Number.isFinite(qh) && qh > 0 ? qh : undefined;
  const requestedExt = path.extname(relativePath).slice(1).toLowerCase();

  const wantsTransform = width !== undefined || height !== undefined;
  const resolvedImagePath = await resolveImagePath(relativePath);
  if (resolvedImagePath === undefined) {
    return next();
  }

  if (wantsTransform) {
    const cacheKey = `${relativePath}|${width ?? ""}x${height ?? ""}|${requestedExt}`;
    const contentType =
      requestedExt === "webp"
        ? "image/webp"
        : requestedExt === "avif"
          ? "image/avif"
          : "image/jpeg";

    const cached = transformedImageCache.get(cacheKey);
    if (cached !== undefined) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Content-Type", contentType);
      return res.send(cached);
    }

    let pipeline = sharp(resolvedImagePath);
    if (width !== undefined || height !== undefined) {
      pipeline = pipeline.resize(width, height, { fit: "cover" });
    }

    if (requestedExt === "webp") {
      pipeline = pipeline.webp({ quality: 80 });
    } else if (requestedExt === "avif") {
      pipeline = pipeline.avif({ quality: 50 });
    } else {
      pipeline = pipeline.jpeg({ quality: 85 });
    }

    const buffer = await pipeline.toBuffer();

    if (transformedImageCache.size < TRANSFORMED_IMAGE_CACHE_MAX) {
      transformedImageCache.set(cacheKey, buffer);
    }

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", contentType);
    return res.send(buffer);
  }

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.sendFile(resolvedImagePath);
});

staticRouter.use(async (req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    return next();
  }

  const relativePath = req.path.replace(/^\/+/, "");
  if (MOVIE_MEDIA_PATH.test(req.path) === false && SOUND_MEDIA_PATH.test(req.path) === false) {
    return next();
  }

  const resolvedPath = MOVIE_MEDIA_PATH.test(req.path)
    ? await resolveMediaPath(relativePath, "movies")
    : await resolveMediaPath(relativePath, "sounds");

  if (resolvedPath === undefined) {
    return next();
  }

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.sendFile(resolvedPath);
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    immutable: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    immutable: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
        return;
      }

      if (/-[0-9a-f]{8,}\./i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  }),
);
