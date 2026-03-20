import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const imageOptimizerRouter = Router();

const cache = new Map<string, Buffer>();

function detectBestFormat(acceptHeader: string | undefined): { format: "avif" | "webp" | "jpeg"; contentType: string } {
  if (acceptHeader?.includes("image/avif")) {
    return { format: "avif", contentType: "image/avif" };
  }
  if (acceptHeader?.includes("image/webp")) {
    return { format: "webp", contentType: "image/webp" };
  }
  return { format: "jpeg", contentType: "image/jpeg" };
}

function applyFormat(pipeline: sharp.Sharp, format: "avif" | "webp" | "jpeg", quality: number): sharp.Sharp {
  switch (format) {
    case "avif":
      return pipeline.avif({ quality, effort: 4 });
    case "webp":
      return pipeline.webp({ quality });
    default:
      return pipeline.jpeg({ quality });
  }
}

imageOptimizerRouter.get("/images/profiles/:id.jpg", async (req, res, next) => {
  const { id } = req.params;
  const { format, contentType } = detectBestFormat(req.headers.accept);
  const cacheKey = `profile:${id}:${format}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(cached);
  }

  const filePaths = [
    path.join(UPLOAD_PATH, "images", "profiles", `${id}.jpg`),
    path.join(PUBLIC_PATH, "images", "profiles", `${id}.jpg`),
  ];

  let fileBuffer: Buffer | null = null;
  for (const filePath of filePaths) {
    try {
      fileBuffer = await fs.readFile(filePath) as Buffer;
      break;
    } catch {
      continue;
    }
  }

  if (!fileBuffer) {
    return next();
  }

  try {
    const pipeline = applyFormat(sharp(fileBuffer).resize(96, 96, { fit: "cover" }), format, 60);

    const optimized = await pipeline.toBuffer();
    cache.set(cacheKey, optimized);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(optimized);
  } catch {
    return next();
  }
});

imageOptimizerRouter.get("/images/:id.jpg", async (req, res, next) => {
  const { id } = req.params;
  const { format, contentType } = detectBestFormat(req.headers.accept);
  const cacheKey = `image:${id}:${format}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(cached);
  }

  const filePaths = [
    path.join(UPLOAD_PATH, "images", `${id}.jpg`),
    path.join(PUBLIC_PATH, "images", `${id}.jpg`),
  ];

  let fileBuffer: Buffer | null = null;
  for (const filePath of filePaths) {
    try {
      fileBuffer = await fs.readFile(filePath) as Buffer;
      break;
    } catch {
      continue;
    }
  }

  if (!fileBuffer) {
    return next();
  }

  try {
    const pipeline = applyFormat(
      sharp(fileBuffer).resize(163, undefined, { fit: "inside", withoutEnlargement: true }),
      format,
      60,
    );

    const optimized = await pipeline.toBuffer();
    cache.set(cacheKey, optimized);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(optimized);
  } catch {
    return next();
  }
});
