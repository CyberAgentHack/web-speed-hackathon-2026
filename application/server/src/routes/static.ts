import { promises as fs } from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import serveStatic from "serve-static";
import sharp from "sharp";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// In-memory cache: "filePath:width" → resized JPEG buffer
const imageCache = new Map<string, Buffer>();

async function resizeImageHandler(req: Request, res: Response, next: NextFunction) {
  const widthStr = req.query["width"];
  if (!widthStr || typeof widthStr !== "string") {
    return next();
  }

  const width = parseInt(widthStr, 10);
  if (isNaN(width) || width <= 0 || width > 4000) {
    return next();
  }

  // Only handle .jpg paths
  const reqPath = req.path;
  if (!reqPath.endsWith(".jpg")) {
    return next();
  }

  // Try PUBLIC_PATH first, then UPLOAD_PATH
  const candidatePaths = [
    path.join(PUBLIC_PATH, reqPath),
    path.join(UPLOAD_PATH, reqPath),
  ];

  let filePath: string | null = null;
  for (const p of candidatePaths) {
    try {
      await fs.access(p);
      filePath = p;
      break;
    } catch {
      // not found, try next
    }
  }

  if (!filePath) {
    return next();
  }

  const cacheKey = `${filePath}:${width}`;
  let buf = imageCache.get(cacheKey);

  if (!buf) {
    try {
      buf = await sharp(filePath)
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
      imageCache.set(cacheKey, buf);
    } catch {
      return next();
    }
  }

  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Content-Length", buf.length);
  return res.send(buf);
}

async function movieThumbnailHandler(req: Request, res: Response, next: NextFunction) {
  if (req.query["thumb"] !== "1") {
    return next();
  }

  const reqPath = req.path;
  if (!reqPath.startsWith("/movies/") || !reqPath.endsWith(".gif")) {
    return next();
  }

  const filePath = path.join(UPLOAD_PATH, reqPath);
  try {
    await fs.access(filePath);
  } catch {
    return next();
  }

  const cacheKey = `thumb:${filePath}`;
  let buf = imageCache.get(cacheKey);

  if (!buf) {
    try {
      buf = await sharp(filePath, { pages: 1 })
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
      imageCache.set(cacheKey, buf);
    } catch {
      return next();
    }
  }

  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Content-Length", buf.length);
  return res.send(buf);
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// Movie thumbnail middleware (extract first GIF frame as JPEG)
staticRouter.use(movieThumbnailHandler);

// Image resize middleware (before static file handlers)
staticRouter.use(resizeImageHandler);

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1d",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1d",
  }),
);

// Content-hashed chunks get long cache; main.js/main.css get short cache
staticRouter.use(
  "/scripts",
  serveStatic(CLIENT_DIST_PATH + "/scripts", {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (/chunk-[a-f0-9]+\.js$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    },
  }),
);

staticRouter.use(
  "/styles",
  serveStatic(CLIENT_DIST_PATH + "/styles", {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (/fonts\//.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: 0,
  }),
);
