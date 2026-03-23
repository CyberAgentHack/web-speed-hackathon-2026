import fs from "node:fs";
import path from "node:path";

import type { RequestHandler } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const CACHE_DIR = "/tmp/image-cache";

// Ensure cache directory exists
fs.mkdirSync(CACHE_DIR, { recursive: true });

function findSourceFile(reqPath: string): string | null {
  // reqPath is like /images/xxx.webp or /images/profiles/xxx.webp
  // Try upload path first (uploaded images are .jpg)
  const jpgPath = reqPath.replace(/\.webp$/, ".jpg");

  for (const basePath of [UPLOAD_PATH, PUBLIC_PATH]) {
    const webpFile = path.join(basePath, reqPath);
    if (fs.existsSync(webpFile)) return webpFile;

    const jpgFile = path.join(basePath, jpgPath);
    if (fs.existsSync(jpgFile)) return jpgFile;
  }
  return null;
}

export const imageResizeMiddleware: RequestHandler = async (req, res, next) => {
  // Only handle image requests with width parameter
  if (!req.path.match(/^\/images\/.*\.webp$/) || !req.query["w"]) {
    return next();
  }

  const width = parseInt(req.query["w"] as string, 10);
  if (isNaN(width) || width <= 0 || width > 4000) {
    return next();
  }

  const cacheKey = `${req.path.replace(/\//g, "_")}-${width}.webp`;
  const cachePath = path.join(CACHE_DIR, cacheKey);

  // Serve from cache if available
  if (fs.existsSync(cachePath)) {
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.sendFile(cachePath);
    return;
  }

  const sourceFile = findSourceFile(req.path);
  if (!sourceFile) {
    return next();
  }

  try {
    const buffer = await sharp(sourceFile)
      .resize({ width, withoutEnlargement: true })
      .webp({ nearLossless: true, quality: 90 })
      .toBuffer();

    // Write to cache
    fs.writeFileSync(cachePath, buffer);

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);
  } catch {
    return next();
  }
};
