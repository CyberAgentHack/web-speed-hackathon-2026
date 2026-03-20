import { promises as fs } from "fs";
import path from "path";

import { Hono } from "hono";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const webpCache = new Map<string, Buffer>();

export const imageOptimizationRouter = new Hono<SessionEnv>();

imageOptimizationRouter.get("*", async (c, next) => {
  if (!/\.(jpg|jpeg|png)$/i.test(c.req.path)) {
    return next();
  }

  const acceptHeader = c.req.header("accept") ?? "";
  if (!acceptHeader.includes("image/webp")) {
    return next();
  }

  const requestPath = decodeURIComponent(c.req.path);
  const cacheKey = requestPath;

  if (webpCache.has(cacheKey)) {
    c.header("Content-Type", "image/webp");
    c.header("Cache-Control", "public, max-age=86400");
    c.header("Vary", "Accept");
    return c.body(new Uint8Array(webpCache.get(cacheKey)!));
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
