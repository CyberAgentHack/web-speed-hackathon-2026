import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { Router } from "express";
import sharp from "sharp";

import {
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

const IMAGE_EXTENSIONS = ["jpg", "png", "webp", "tiff", "avif"];

const VALID_FORMATS = ["webp", "avif", "jpg"] as const;
type ImageFormat = (typeof VALID_FORMATS)[number];

const CONTENT_TYPES: Record<ImageFormat, string> = {
  webp: "image/webp",
  avif: "image/avif",
  jpg: "image/jpeg",
};

async function findImageFile(
  imageId: string,
  subdir: string,
): Promise<string | null> {
  for (const dir of [UPLOAD_PATH, PUBLIC_PATH]) {
    for (const ext of IMAGE_EXTENSIONS) {
      const filePath = path.resolve(dir, subdir, `${imageId}.${ext}`);
      try {
        await fsp.access(filePath);
        return filePath;
      } catch {
        // continue
      }
    }
  }
  return null;
}

function parseQueryParams(query: Record<string, unknown>) {
  let w: number | undefined;
  let format: ImageFormat = "webp";
  let q = 80;

  if (query["w"]) {
    const parsed = Number(query["w"]);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 2000) {
      w = Math.round(parsed);
    }
  }

  if (query["format"] && VALID_FORMATS.includes(query["format"] as ImageFormat)) {
    format = query["format"] as ImageFormat;
  }

  if (query["q"]) {
    const parsed = Number(query["q"]);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 100) {
      q = Math.round(parsed);
    }
  }

  return { w, format, q };
}

async function handleImageRequest(
  req: Parameters<Parameters<ReturnType<typeof Router>["get"]>[1]>[0],
  res: Parameters<Parameters<ReturnType<typeof Router>["get"]>[1]>[1],
  subdir: string,
) {
  const imageId = req.params["id"]?.replace(/\.jpg$/, "");
  if (!imageId) {
    res.status(400).end();
    return;
  }

  const filePath = await findImageFile(imageId, subdir);
  if (!filePath) {
    res.status(404).end();
    return;
  }

  const { w, format, q } = parseQueryParams(req.query as Record<string, unknown>);
  const hasTransformParams = w != null || req.query["format"] || req.query["q"];

  const stat = await fsp.stat(filePath);
  const raw = `${stat.mtimeMs}-${w ?? "orig"}-${format}-${q}`;
  const etag = `"${crypto.createHash("md5").update(raw).digest("hex")}"`;


  res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.set("ETag", etag);

  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }

  if (!hasTransformParams) {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
    res.type(contentType);
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.type(CONTENT_TYPES[format]);

  const transform = sharp();
  if (w != null) {
    transform.resize({ width: w, withoutEnlargement: true });
  }
  transform.toFormat(format, { quality: q });

  transform.on("error", () => {
    if (!res.headersSent) {
      res.status(500).end();
    }
  });

  fs.createReadStream(filePath).pipe(transform).pipe(res);
}

export const imageServeRouter = Router();

imageServeRouter.get("/images/profiles/:id", (req, res) => {
  void handleImageRequest(req, res, "images/profiles");
});

imageServeRouter.get("/images/:id", (req, res) => {
  void handleImageRequest(req, res, "images");
});
