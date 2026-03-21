import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const IMAGES_DIR = path.resolve(import.meta.dirname!, "../public/images");
const PROFILES_DIR = path.join(IMAGES_DIR, "profiles");

const HD_MAX = 640;
const PROFILE_SIZE = 128;
const AVIF_QUALITY = 40;

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function optimizeImage(
  filePath: string,
  maxWidth: number,
  maxHeight: number,
): Promise<{ oldSize: number; newSize: number }> {
  const buf = await fs.readFile(filePath);
  const optimized = await sharp(buf)
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .avif({ quality: AVIF_QUALITY, effort: 6 })
    .toBuffer();

  const newPath = filePath.replace(/\.jpe?g$/i, ".avif");
  await fs.writeFile(newPath, optimized);
  if (newPath !== filePath) {
    await fs.unlink(filePath);
  }
  return { oldSize: buf.byteLength, newSize: optimized.byteLength };
}

async function processDir(
  dir: string,
  maxWidth: number,
  maxHeight: number,
): Promise<{ totalOld: number; totalNew: number }> {
  const files = await fs.readdir(dir);
  const jpgs = files.filter((f) => /\.jpe?g$/i.test(f));

  let totalOld = 0;
  let totalNew = 0;

  for (const file of jpgs) {
    const filePath = path.join(dir, file);
    const { oldSize, newSize } = await optimizeImage(filePath, maxWidth, maxHeight);
    totalOld += oldSize;
    totalNew += newSize;
    const saved = (((oldSize - newSize) / oldSize) * 100).toFixed(1);
    console.log(`  ${file}: ${fmt(oldSize)} -> ${fmt(newSize)} (${saved}% reduced)`);
  }

  return { totalOld, totalNew };
}

console.log("=== Optimizing main images (HD 1280px) ===");
const main = await processDir(IMAGES_DIR, HD_MAX, HD_MAX);

console.log("\n=== Optimizing profile images (128x128) ===");
const profiles = await processDir(PROFILES_DIR, PROFILE_SIZE, PROFILE_SIZE);

const totalOld = main.totalOld + profiles.totalOld;
const totalNew = main.totalNew + profiles.totalNew;
const saved = (((totalOld - totalNew) / totalOld) * 100).toFixed(1);
console.log(`\n=== Total: ${fmt(totalOld)} -> ${fmt(totalNew)} (${saved}% reduced) ===`);
