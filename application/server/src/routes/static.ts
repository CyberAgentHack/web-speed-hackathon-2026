import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";
import sharp from "sharp";

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
