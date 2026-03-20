import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const imageOptimizerRouter = Router();

const cache = new Map<string, Buffer>();

imageOptimizerRouter.get("/images/profiles/:id.jpg", async (req, res, next) => {
  const { id } = req.params;
  const acceptsWebP = req.headers.accept?.includes("image/webp") ?? false;
  const cacheKey = `profile:${id}:${acceptsWebP ? "webp" : "jpg"}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", acceptsWebP ? "image/webp" : "image/jpeg");
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
    let pipeline = sharp(fileBuffer).resize(96, 96, { fit: "cover" });
    let contentType: string;

    if (acceptsWebP) {
      pipeline = pipeline.webp({ quality: 80 });
      contentType = "image/webp";
    } else {
      pipeline = pipeline.jpeg({ quality: 80 });
      contentType = "image/jpeg";
    }

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
  const acceptsWebP = req.headers.accept?.includes("image/webp") ?? false;
  const cacheKey = `image:${id}:${acceptsWebP ? "webp" : "jpg"}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", acceptsWebP ? "image/webp" : "image/jpeg");
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
    let pipeline = sharp(fileBuffer).resize(330, undefined, {
      fit: "inside",
      withoutEnlargement: true,
    });
    let contentType: string;

    if (acceptsWebP) {
      pipeline = pipeline.webp({ quality: 70 });
      contentType = "image/webp";
    } else {
      pipeline = pipeline.jpeg({ quality: 70 });
      contentType = "image/jpeg";
    }

    const optimized = await pipeline.toBuffer();
    cache.set(cacheKey, optimized);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(optimized);
  } catch {
    return next();
  }
});
