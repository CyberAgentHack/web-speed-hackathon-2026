import { promises as fs } from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import sharp from "sharp";
import serveStatic from "serve-static";

import { CLIENT_DIST_PATH, PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

const IMAGE_CACHE_PATH = path.resolve(UPLOAD_PATH, "cache/images");

staticRouter.get("/images/*relativePath", async (req, res, next) => {
  const relativePath = (req.params as Record<string, string>)["relativePath"];
  if (relativePath === undefined) return next();
  const originalPath = path.resolve(UPLOAD_PATH, "images", relativePath);

  try {
    await fs.access(originalPath);
  } catch {
    return next();
  }

  const cachedPath = path.resolve(IMAGE_CACHE_PATH, relativePath.replace(/\.jpg$/, ".webp"));

  try {
    await fs.access(cachedPath);
  } catch {
    await fs.mkdir(path.dirname(cachedPath), { recursive: true });
    await sharp(originalPath)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(cachedPath);
  }

  res.setHeader("Content-Type", "image/webp");
  res.setHeader("Cache-Control", "max-age=31536000, immutable");
  return res.sendFile(cachedPath);
});

staticRouter.use(serveStatic(UPLOAD_PATH));

staticRouter.use(serveStatic(PUBLIC_PATH));

staticRouter.use(serveStatic(CLIENT_DIST_PATH));
