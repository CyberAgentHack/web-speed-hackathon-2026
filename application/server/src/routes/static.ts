import fs from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import sharp from "sharp";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// 画像最適化: JPEG画像をWebPに変換して配信
const imageCache = new Map<string, Buffer>();

staticRouter.use(async (req, res, next) => {
  // /images/*.jpg パスのみ処理
  if (!req.path.startsWith("/images/") || !req.path.endsWith(".jpg")) {
    return next();
  }

  const accept = req.headers.accept || "";
  const supportsWebP = accept.includes("image/webp");
  const supportsAvif = accept.includes("image/avif");

  const relativePath = req.path.slice(1); // "images/..." に変換
  const imagePath = path.join(PUBLIC_PATH, relativePath);

  if (!fs.existsSync(imagePath)) {
    return next();
  }

  const isProfile = req.path.startsWith("/images/profiles/");
  const format = supportsAvif ? "avif" as const : supportsWebP ? "webp" as const : "jpeg" as const;
  const cacheKey = `${relativePath}:${format}`;

  if (imageCache.has(cacheKey)) {
    const cached = imageCache.get(cacheKey)!;
    const contentType = format === "avif" ? "image/avif" : format === "webp" ? "image/webp" : "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=604800, immutable");
    res.set("Vary", "Accept");
    return res.send(cached);
  }

  try {
    let pipeline = sharp(imagePath);

    if (isProfile) {
      pipeline = pipeline.resize(128, 128, { fit: "cover" });
    } else {
      pipeline = pipeline.resize(960, undefined, { fit: "inside", withoutEnlargement: true });
    }

    let buffer: Buffer;
    let contentType: string;
    if (format === "avif") {
      buffer = await pipeline.avif({ quality: 50 }).toBuffer();
      contentType = "image/avif";
    } else if (format === "webp") {
      buffer = await pipeline.webp({ quality: 75 }).toBuffer();
      contentType = "image/webp";
    } else {
      buffer = await pipeline.jpeg({ quality: 75, mozjpeg: true }).toBuffer();
      contentType = "image/jpeg";
    }

    imageCache.set(cacheKey, buffer);

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=604800, immutable");
    res.set("Vary", "Accept");
    return res.send(buffer);
  } catch {
    return next();
  }
});

// GIF最適化: GIFをWebPアニメーションに変換して配信
const gifCache = new Map<string, Buffer>();

staticRouter.use(async (req, res, next) => {
  if (!req.path.startsWith("/movies/") || !req.path.endsWith(".gif")) {
    return next();
  }

  const accept = req.headers.accept || "";
  const supportsWebP = accept.includes("image/webp");
  if (!supportsWebP) {
    return next();
  }

  const relativePath = req.path.slice(1);
  const gifPath = path.join(PUBLIC_PATH, relativePath);

  if (!fs.existsSync(gifPath)) {
    return next();
  }

  const cacheKey = `${relativePath}:webp`;
  if (gifCache.has(cacheKey)) {
    const cached = gifCache.get(cacheKey)!;
    res.set("Content-Type", "image/webp");
    res.set("Cache-Control", "public, max-age=604800, immutable");
    res.set("Vary", "Accept");
    return res.send(cached);
  }

  try {
    const buffer = await sharp(gifPath, { animated: true })
      .webp({ quality: 50 })
      .toBuffer();

    gifCache.set(cacheKey, buffer);

    res.set("Content-Type", "image/webp");
    res.set("Cache-Control", "public, max-age=604800, immutable");
    res.set("Vary", "Accept");
    return res.send(buffer);
  } catch {
    return next();
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    maxAge: "7d",
    immutable: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    maxAge: "7d",
    immutable: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    maxAge: "1y",
    immutable: true,
  }),
);
