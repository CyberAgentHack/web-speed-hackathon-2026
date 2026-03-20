import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

sharp.cache(false);
sharp.concurrency(3);

export const imageResizeRouter = Router();

const ALLOWED_WIDTHS = [40, 80, 192, 245, 490, 494, 960, 1200];

function clampWidth(w: number): number {
  for (const allowed of ALLOWED_WIDTHS) {
    if (w <= allowed) return allowed;
  }
  return ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1]!;
}

// In-memory cache for resized images (LRU-like, capped at 100 entries)
const MAX_CACHE_SIZE = 500;
const cache = new Map<string, Buffer>();

function cacheSet(key: string, value: Buffer) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
}

export function clearImageCache() {
  cache.clear();
}

const PREWARM_WIDTHS = [40, 96];

export async function prewarmImageCache() {
  const profileDir = path.resolve(PUBLIC_PATH, "images", "profiles");
  let files: string[];
  try {
    files = (await fs.readdir(profileDir)).filter((f) => f.endsWith(".avif"));
  } catch {
    return;
  }

  const tasks: Array<() => Promise<void>> = [];
  for (const file of files) {
    for (const width of PREWARM_WIDTHS) {
      const imagePath = `profiles/${file}`;
      const cacheKey = `${imagePath}:${width}`;
      if (cache.has(cacheKey)) continue;
      const filePath = path.resolve(profileDir, file);
      tasks.push(async () => {
        try {
          const buf = await sharp(filePath)
            .resize({ width, withoutEnlargement: true })
            .avif({ quality: 50 })
            .toBuffer();
          cacheSet(cacheKey, buf);
        } catch {
          // skip
        }
      });
    }
  }

  // Process in batches of 3 (matching sharp concurrency)
  for (let i = 0; i < tasks.length; i += 3) {
    await Promise.all(tasks.slice(i, i + 3).map((t) => t()));
  }
  console.log(`[prewarm] cached ${cache.size} profile images`);
}

imageResizeRouter.get("/images/{*path}", async (req, res, next) => {
  const wParam = req.query["w"];
  if (wParam == null) return next();

  const width = clampWidth(Number(wParam));
  if (Number.isNaN(width)) return next();

  const imagePathSegs = (req.params as Record<string, string[]>)["path"];
  const imagePath = imagePathSegs?.join("/") ?? "";
  if (imagePath == null) return next();
  const cacheKey = `${imagePath}:${width}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", "image/avif");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(cached);
  }

  // Try upload path first, then public path
  let filePath = path.resolve(UPLOAD_PATH, "images", imagePath!);
  try {
    await fs.access(filePath);
  } catch {
    filePath = path.resolve(PUBLIC_PATH, "images", imagePath!);
    try {
      await fs.access(filePath);
    } catch {
      return next();
    }
  }

  try {
    const resized = await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 50 })
      .toBuffer();

    cacheSet(cacheKey, resized);

    res.setHeader("Content-Type", "image/avif");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(resized);
  } catch {
    return next();
  }
});