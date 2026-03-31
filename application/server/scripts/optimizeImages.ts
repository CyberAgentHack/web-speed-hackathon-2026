import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");
const PROFILE_DIR = path.join(PUBLIC_DIR, "images/profiles");
const POST_DIR = path.join(PUBLIC_DIR, "images");
const PROFILE_SIZE = 256;
const MAX_POST_WIDTH = 1280;
const QUALITY = 80;

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

async function optimizeProfileImages() {
  await ensureDir(PROFILE_DIR);
  const entries = await readdir(PROFILE_DIR);
  const files = entries.filter((file) => file.endsWith(".jpg"));
  console.log(`[optimize:images] profiles -> ${files.length} files`);

  await Promise.all(
    files.map(async (file) => {
      const src = path.join(PROFILE_DIR, file);
      const dest = path.join(PROFILE_DIR, `${path.parse(file).name}.webp`);
      await sharp(src)
        .resize(PROFILE_SIZE, PROFILE_SIZE, { fit: "cover" })
        .webp({ quality: QUALITY })
        .toFile(dest);
    }),
  );
}

async function optimizePostImages() {
  await ensureDir(POST_DIR);
  const entries = await readdir(POST_DIR);
  const files = [];
  for (const file of entries) {
    const full = path.join(POST_DIR, file);
    const info = await stat(full);
    if (info.isFile() && file.endsWith(".jpg")) {
      files.push(file);
    }
  }

  console.log(`[optimize:images] posts -> ${files.length} files`);

  await Promise.all(
    files.map(async (file) => {
      const src = path.join(POST_DIR, file);
      const dest = path.join(POST_DIR, `${path.parse(file).name}.webp`);
      await sharp(src)
        .resize({ width: MAX_POST_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(dest);
    }),
  );
}

async function main() {
  await Promise.all([optimizeProfileImages(), optimizePostImages()]);
  console.log("[optimize:images] completed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
