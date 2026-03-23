import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { RequestHandler } from "express";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const MAX_IMAGE_WIDTH = 1200;
const JPEG_QUALITY = 75;
const MAX_ICON_WIDTH = 512;
const WEBP_QUALITY = 80;
const MAX_GIF_WIDTH = 480;

// プロフィール画像・アイコンのパスパターン
const ICON_PATH_RE = /\/(profiles|icons)\//;

// 変換済み画像のインメモリキャッシュ
const cache = new Map<string, Buffer>();

async function getOptimizedImage(filePath: string, isIcon: boolean): Promise<Buffer | null> {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) return null;

  const cacheKey = `${isIcon ? "icon" : "img"}:${filePath}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  try {
    const optimized = isIcon
      ? await sharp(filePath)
          .resize({ width: MAX_ICON_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer()
      : await sharp(filePath)
          .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
          .withMetadata()
          .jpeg({ mozjpeg: true, quality: JPEG_QUALITY })
          .toBuffer();

    cache.set(cacheKey, optimized);
    return optimized;
  } catch {
    return null;
  }
}

async function getOptimizedGif(filePath: string): Promise<Buffer | null> {
  if (path.extname(filePath).toLowerCase() !== ".gif") return null;

  if (cache.has(filePath)) return cache.get(filePath)!;

  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  const tmpOut = path.join(os.tmpdir(), `wsh-${Date.now()}-${path.basename(filePath, ".gif")}.mp4`);
  try {
    await execFileAsync("ffmpeg", [
      "-i", filePath,
      "-vf", `scale=${MAX_GIF_WIDTH}:-2:flags=lanczos,format=yuv420p`,
      "-c:v", "libx264",
      "-crf", "28",
      "-preset", "fast",
      "-movflags", "+faststart",
      "-an",
      "-y",
      tmpOut,
    ]);

    const optimized = await fs.readFile(tmpOut);
    cache.set(filePath, optimized);
    return optimized;
  } catch {
    return null;
  } finally {
    await fs.unlink(tmpOut).catch(() => {});
  }
}

export function createImageOptimizeMiddleware(basePaths: string[]): RequestHandler {
  return async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    const urlPath = req.path;
    const ext = path.extname(urlPath).toLowerCase();

    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      const isIcon = ICON_PATH_RE.test(urlPath);
      for (const base of basePaths) {
        const filePath = path.join(base, urlPath);
        const optimized = await getOptimizedImage(filePath, isIcon);
        if (optimized == null) continue;

        res.setHeader("Content-Type", isIcon ? "image/webp" : "image/jpeg");
        res.setHeader("Content-Length", optimized.length);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        req.method === "HEAD" ? res.end() : res.end(optimized);
        return;
      }
    }

    if (ext === ".gif") {
      for (const base of basePaths) {
        const filePath = path.join(base, urlPath);
        const optimized = await getOptimizedGif(filePath);
        if (optimized == null) continue;

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Content-Length", optimized.length);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        req.method === "HEAD" ? res.end() : res.end(optimized);
        return;
      }
    }

    next();
  };
}
