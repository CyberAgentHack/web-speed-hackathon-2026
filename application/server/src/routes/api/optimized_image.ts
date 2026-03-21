import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";

import { CACHE_PATH, PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const ALLOWED_WIDTHS = [80, 96, 128, 256, 512, 800, 1024];

export const optimizedImageRouter = Router();

async function findSourcePath(imageId: string, subDir: string): Promise<string> {
  const extensions = ["jpg", "jpeg", "png", "gif", "webp"];
  for (const base of [UPLOAD_PATH, PUBLIC_PATH]) {
    for (const ext of extensions) {
      const candidate = path.resolve(base, subDir, `${imageId}.${ext}`);
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // not found, continue
      }
    }
  }
  throw new httpErrors.NotFound();
}

async function serveOptimizedImage(
  res: import("express").Response,
  imageId: string,
  subDir: string,
  type: string,
  width: number | undefined,
  format: "webp" | "jpg",
): Promise<import("express").Response> {
  const cacheKey = `${type}_${imageId}_${width ?? "orig"}.${format}`;
  const cacheDir = path.resolve(CACHE_PATH, "images");
  const cachePath = path.resolve(cacheDir, cacheKey);

  try {
    const cached = await fs.readFile(cachePath);
    return res
      .status(200)
      .set("Cache-Control", "public, max-age=31536000, immutable")
      .type(format === "webp" ? "image/webp" : "image/jpeg")
      .send(cached);
  } catch {
    // cache miss
  }

  const sourcePath = await findSourcePath(imageId, subDir);

  let pipeline = sharp(sourcePath);
  if (width !== undefined) {
    pipeline = pipeline.resize(width);
  }
  const buffer =
    format === "webp"
      ? await pipeline.webp({ quality: 80 }).toBuffer()
      : await pipeline.jpeg({ quality: 85 }).toBuffer();

  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(cachePath, buffer);

  return res
    .status(200)
    .set("Cache-Control", "public, max-age=31536000, immutable")
    .type(format === "webp" ? "image/webp" : "image/jpeg")
    .send(buffer);
}

function parseParams(query: Record<string, unknown>): { width: number | undefined; format: "webp" | "jpg" } {
  const w = query["w"];
  let width: number | undefined;
  if (w !== undefined) {
    const parsed = Number(w);
    if (!ALLOWED_WIDTHS.includes(parsed)) {
      throw new httpErrors.BadRequest("Invalid width");
    }
    width = parsed;
  }

  const fmt = query["format"];
  const format: "webp" | "jpg" = fmt === "jpg" ? "jpg" : "webp";

  return { format, width };
}

optimizedImageRouter.get("/optimized-image/profiles/:imageId", async (req, res) => {
  const { imageId } = req.params;
  const { format, width } = parseParams(req.query as Record<string, unknown>);
  return serveOptimizedImage(res, imageId, "images/profiles", "profile", width, format);
});

optimizedImageRouter.get("/optimized-image/:imageId", async (req, res) => {
  const { imageId } = req.params;
  const { format, width } = parseParams(req.query as Record<string, unknown>);
  return serveOptimizedImage(res, imageId, "images", "post", width, format);
});
