import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const imageOptimizeRouter = Router();

const CACHE = new Map<string, Buffer>();

async function processImage(
  sourceBuffer: Buffer,
  width: number,
  webp: boolean,
): Promise<Buffer> {
  const pipeline = sharp(sourceBuffer).resize({ width, withoutEnlargement: true });
  return webp
    ? pipeline.webp({ quality: 80 }).toBuffer()
    : pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

function cacheKey(imagePath: string, width: number, webp: boolean): string {
  return `${imagePath}:${width}:${webp ? "webp" : "jpg"}`;
}

/** サーバー起動時に全画像を事前処理してキャッシュに乗せる */
export async function warmImageCache(): Promise<void> {
  const dirs = [
    { dir: path.join(PUBLIC_PATH, "images"), prefix: "/images" },
    { dir: path.join(PUBLIC_PATH, "images/profiles"), prefix: "/images/profiles" },
  ];

  const tasks: Promise<void>[] = [];

  for (const { dir, prefix } of dirs) {
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith(".jpg")) continue;
      const imagePath = `${prefix}/${file}`;
      const isProfile = prefix.includes("profiles");
      const width = isProfile ? 128 : 800;

      tasks.push(
        (async () => {
          try {
            const sourceBuffer = await fs.readFile(path.join(dir, file));
            const [webpBuf, jpgBuf] = await Promise.all([
              processImage(sourceBuffer, width, true),
              processImage(sourceBuffer, width, false),
            ]);
            CACHE.set(cacheKey(imagePath, width, true), webpBuf);
            CACHE.set(cacheKey(imagePath, width, false), jpgBuf);
          } catch {
            // 失敗しても起動は継続
          }
        })(),
      );
    }
  }

  await Promise.all(tasks);
  console.log(`[image cache] warmed ${CACHE.size} entries`);
}

// /images/*.jpg および /images/profiles/*.jpg をリサイズ + WebP 変換して配信する
imageOptimizeRouter.get(/^\/images\/.+\.jpg$/, async (req, res) => {
  const acceptsWebP = req.headers.accept?.includes("image/webp") ?? false;
  const requestedWidth = req.query["w"] != null ? Number(req.query["w"]) : 800;
  const key = cacheKey(req.path, requestedWidth, acceptsWebP);

  let optimized = CACHE.get(key);

  if (optimized == null) {
    const candidates = [
      path.join(UPLOAD_PATH, req.path),
      path.join(PUBLIC_PATH, req.path),
    ];
    let sourceBuffer: Buffer | null = null;
    for (const candidate of candidates) {
      try {
        sourceBuffer = await fs.readFile(candidate);
        break;
      } catch {
        // 次の候補へ
      }
    }

    if (sourceBuffer == null) {
      return res.status(404).end();
    }

    optimized = await processImage(sourceBuffer, requestedWidth, acceptsWebP);
    CACHE.set(key, optimized);
  }

  res.set({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": acceptsWebP ? "image/webp" : "image/jpeg",
    "Vary": "Accept",
  });
  return res.send(optimized);
});
