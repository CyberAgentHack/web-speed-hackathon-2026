import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// In-memory cache for converted WebP images
const webpCache = new Map<string, Buffer>();

export const imageOptimizationRouter = Router();

/**
 * Intercept requests for .jpg images and serve WebP when the client supports it.
 * Falls through to static file serving if the client doesn't accept WebP.
 */
imageOptimizationRouter.get(/\.(jpg|jpeg|png)$/i, async (req, res, next) => {
  const acceptHeader = req.headers.accept ?? "";
  if (!acceptHeader.includes("image/webp")) {
    return next();
  }

  const requestPath = decodeURIComponent(req.path);
  const cacheKey = requestPath;

  // Serve from cache if available
  if (webpCache.has(cacheKey)) {
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Vary", "Accept");
    return res.send(webpCache.get(cacheKey));
  }

  // Try to find the original file in upload or public directories
  const candidates = [path.join(UPLOAD_PATH, requestPath), path.join(PUBLIC_PATH, requestPath)];

  let originalPath: string | null = null;
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      originalPath = candidate;
      break;
    } catch {
      // File not found in this directory, try next
    }
  }

  if (originalPath == null) {
    return next();
  }

  try {
    const webpBuffer = await sharp(originalPath).webp({ quality: 80 }).toBuffer();

    webpCache.set(cacheKey, webpBuffer);

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Vary", "Accept");
    return res.send(webpBuffer);
  } catch {
    // If conversion fails, fall through to serve original
    return next();
  }
});
