import { promises as fs } from "fs";
import path from "path";

import { Hono } from "hono";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const avifCache = new Map<string, Buffer>();
const webpCache = new Map<string, Buffer>();

export const imageOptimizationRouter = new Hono<SessionEnv>();

imageOptimizationRouter.get("*", async (c, next) => {
  if (!/\.(jpg|jpeg|png)$/i.test(c.req.path)) {
    return next();
  }

  const acceptHeader = c.req.header("accept") ?? "";
  const supportsAvif = acceptHeader.includes("image/avif");
  const supportsWebp = acceptHeader.includes("image/webp");

  if (!supportsAvif && !supportsWebp) {
    return next();
  }

  const requestPath = decodeURIComponent(c.req.path);
  const cacheKey = requestPath;

  // AVIF has highest priority
  if (supportsAvif) {
    if (avifCache.has(cacheKey)) {
      c.header("Content-Type", "image/avif");
      c.header("Cache-Control", "public, max-age=86400");
      c.header("Vary", "Accept");
      return c.body(new Uint8Array(avifCache.get(cacheKey)!));
    }
  } else if (supportsWebp) {
    if (webpCache.has(cacheKey)) {
      c.header("Content-Type", "image/webp");
      c.header("Cache-Control", "public, max-age=86400");
      c.header("Vary", "Accept");
      return c.body(new Uint8Array(webpCache.get(cacheKey)!));
    }
  }

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
    if (supportsAvif) {
      const avifBuffer = await sharp(originalPath).avif({ quality: 63, effort: 4 }).toBuffer();

      avifCache.set(cacheKey, avifBuffer);

      c.header("Content-Type", "image/avif");
      c.header("Cache-Control", "public, max-age=86400");
      c.header("Vary", "Accept");
      return c.body(new Uint8Array(avifBuffer));
    }

    const webpBuffer = await sharp(originalPath).webp({ quality: 80 }).toBuffer();

    webpCache.set(cacheKey, webpBuffer);

    c.header("Content-Type", "image/webp");
    c.header("Cache-Control", "public, max-age=86400");
    c.header("Vary", "Accept");
    return c.body(new Uint8Array(webpBuffer));
  } catch {
    return next();
  }
});
