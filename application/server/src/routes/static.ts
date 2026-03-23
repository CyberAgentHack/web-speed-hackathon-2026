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
const imageTaskCache = new Map<string, Promise<Buffer | null>>();

async function resolveStaticFilePath(reqPath: string): Promise<string | null> {
  const candidatePaths = [
    path.join(PUBLIC_PATH, reqPath),
    path.join(UPLOAD_PATH, reqPath),
  ];

  for (const candidatePath of candidatePaths) {
    try {
      await fs.access(candidatePath);
      return candidatePath;
    } catch {
      // not found, try next
    }
  }

  return null;
}

function getOrCreateImageTask(
  cacheKey: string,
  factory: () => Promise<Buffer>,
): Promise<Buffer | null> {
  const cachedBuffer = imageCache.get(cacheKey);
  if (cachedBuffer != null) {
    return Promise.resolve(cachedBuffer);
  }

  const inFlightTask = imageTaskCache.get(cacheKey);
  if (inFlightTask != null) {
    return inFlightTask;
  }

  const task = factory()
    .then((buffer) => {
      imageCache.set(cacheKey, buffer);
      return buffer;
    })
    .catch(() => null)
    .finally(() => {
      imageTaskCache.delete(cacheKey);
    });

  imageTaskCache.set(cacheKey, task);
  return task;
}

async function getResizedImageBuffer(filePath: string, width: number): Promise<Buffer | null> {
  const cacheKey = `${filePath}:${width}`;
  return getOrCreateImageTask(cacheKey, async () =>
    sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer(),
  );
}

async function getMovieThumbnailBuffer(filePath: string): Promise<Buffer | null> {
  const cacheKey = `thumb:${filePath}`;
  return getOrCreateImageTask(cacheKey, async () =>
    sharp(filePath, { pages: 1 })
      .resize({ width: 600, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer(),
  );
}

export async function warmResizedImage(reqPath: string, width: number): Promise<void> {
  if (!reqPath.endsWith(".jpg") || width <= 0 || width > 4000) {
    return;
  }

  const filePath = await resolveStaticFilePath(reqPath);
  if (filePath == null) {
    return;
  }

  await getResizedImageBuffer(filePath, width);
}

export async function warmMovieThumbnail(reqPath: string): Promise<void> {
  if (!reqPath.startsWith("/movies/") || !reqPath.endsWith(".gif")) {
    return;
  }

  const filePath = await resolveStaticFilePath(reqPath);
  if (filePath == null) {
    return;
  }

  await getMovieThumbnailBuffer(filePath);
}

export function primeResizedImage(reqPath: string, width: number): void {
  void warmResizedImage(reqPath, width);
}

export function primeMovieThumbnail(reqPath: string): void {
  void warmMovieThumbnail(reqPath);
}

async function soundAliasHandler(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/sounds/") || !req.path.endsWith(".mp3")) {
    return next();
  }

  const soundId = path.basename(req.path, ".mp3");
  const candidateFiles = [
    { contentType: "audio/mpeg", ext: "mp3" },
    { contentType: "audio/wav", ext: "wav" },
  ];

  for (const { contentType, ext } of candidateFiles) {
    const filePath = path.join(UPLOAD_PATH, "sounds", `${soundId}.${ext}`);
    try {
      await fs.access(filePath);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.type(contentType);
      return res.sendFile(filePath);
    } catch {
      // try next extension
    }
  }

  return next();
}

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
  const filePath = await resolveStaticFilePath(reqPath);
  if (!filePath) {
    return next();
  }

  const buf = await getResizedImageBuffer(filePath, width);
  if (!buf) {
    return next();
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

  const filePath = await resolveStaticFilePath(reqPath);
  if (!filePath) {
    return next();
  }

  const buf = await getMovieThumbnailBuffer(filePath);
  if (!buf) {
    return next();
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

// Allow `/sounds/:id.mp3` to resolve uploaded WAV files without changing client URLs.
staticRouter.use(soundAliasHandler);

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
