import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const imageOptimizeRouter = Router();

const CACHE_DIR = path.resolve(PUBLIC_PATH, "../.image-cache");

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

imageOptimizeRouter.get(/\/(images|movies)\/.*\.(jpg|jpeg|png|gif)$/i, async (req, res, next) => {
  const accept = req.headers.accept || "";
  const supportsAvif = accept.includes("image/avif");
  const supportsWebp = accept.includes("image/webp");

  if (!supportsWebp && !supportsAvif) {
    return next();
  }

  const format = supportsAvif ? "avif" : "webp";
  const relPath = req.path;

  // Try to find the original file
  let filePath: string | null = null;
  for (const base of [PUBLIC_PATH, UPLOAD_PATH]) {
    const candidate = path.resolve(base, `.${relPath}`);
    try {
      await fs.access(candidate);
      filePath = candidate;
      break;
    } catch {
      continue;
    }
  }

  if (!filePath) {
    return next();
  }

  // Check cache
  const cacheKey = `${relPath.replace(/\//g, "_")}.${format}`;
  const cachePath = path.resolve(CACHE_DIR, cacheKey);

  try {
    const cached = await fs.readFile(cachePath);
    res.set("Content-Type", `image/${format}`);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Vary", "Accept");
    return res.send(cached);
  } catch {
    // Cache miss
  }

  try {
    await ensureCacheDir();

    let pipeline = sharp(filePath);

    if (format === "avif") {
      pipeline = pipeline.avif({ quality: 50 });
    } else {
      pipeline = pipeline.webp({ quality: 75 });
    }

    const buffer = await pipeline.toBuffer();
    await fs.writeFile(cachePath, buffer);

    res.set("Content-Type", `image/${format}`);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Vary", "Accept");
    return res.send(buffer);
  } catch {
    return next();
  }
});
