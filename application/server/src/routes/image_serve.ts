import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const SIZES = { l: 800, m: 360, s: 160 } as const;
type SizeKey = keyof typeof SIZES;

// リサイズ済みバッファのインメモリキャッシュ
const cache = new Map<string, Buffer>();

async function findFile(relativePath: string): Promise<string | null> {
  for (const base of [UPLOAD_PATH, PUBLIC_PATH]) {
    const fullPath = path.resolve(base, relativePath);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      // このベースパスには存在しない
    }
  }
  return null;
}

export const imageServeRouter = Router();

imageServeRouter.get(/^\/images\//, async (req, res, next) => {
  const q = req.query["q"];
  if (typeof q !== "string" || !(q in SIZES)) {
    return next();
  }

  const size = SIZES[q as SizeKey];
  const relativePath = req.path.replace(/^\//, "");

  const filePath = await findFile(relativePath);
  if (filePath == null) {
    return next();
  }

  const cacheKey = `${filePath}:${size}`;
  let outputBuffer = cache.get(cacheKey);

  if (outputBuffer == null) {
    const rawBuffer = await fs.readFile(filePath);
    outputBuffer = await sharp(rawBuffer)
      .resize(size, size, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    cache.set(cacheKey, outputBuffer);
  }

  res
    .type("image/webp")
    .send(outputBuffer);
});
