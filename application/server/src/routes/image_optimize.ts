import fs from "node:fs/promises";
import path from "node:path";

import type { RequestHandler } from "express";
import sharp from "sharp";

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 80;

// 変換済み画像のインメモリキャッシュ
const cache = new Map<string, Buffer>();

async function getOptimized(filePath: string): Promise<Buffer | null> {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) return null;

  if (cache.has(filePath)) {
    return cache.get(filePath)!;
  }

  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  try {
    const optimized = await sharp(filePath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ mozjpeg: true, quality: JPEG_QUALITY })
      .toBuffer();

    cache.set(filePath, optimized);
    return optimized;
  } catch {
    return null;
  }
}

export function createImageOptimizeMiddleware(basePaths: string[]): RequestHandler {
  return async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    const urlPath = req.path;
    const ext = path.extname(urlPath).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) return next();

    for (const base of basePaths) {
      const filePath = path.join(base, urlPath);
      const optimized = await getOptimized(filePath);
      if (optimized == null) continue;

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", optimized.length);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      if (req.method === "HEAD") {
        res.end();
      } else {
        res.end(optimized);
      }
      return;
    }

    next();
  };
}
