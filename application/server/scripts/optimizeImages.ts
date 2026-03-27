import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const PUBLIC_PATH = path.resolve(import.meta.dirname, "../../public");

const PROFILE_SIZES = [96, 256];
const POST_SIZES = [320, 640, 960];
const WEBP_QUALITY = 80;

async function optimizeProfileImages(): Promise<void> {
  const profileDir = path.join(PUBLIC_PATH, "images/profiles");
  const files = fs.readdirSync(profileDir).filter((f) => f.endsWith(".jpg"));

  console.log(`Optimizing ${files.length} profile images...`);

  for (const file of files) {
    const id = path.basename(file, ".jpg");
    const srcPath = path.join(profileDir, file);

    for (const width of PROFILE_SIZES) {
      const outPath = path.join(profileDir, `${id}-${width}w.webp`);
      await sharp(srcPath)
        .resize(width, width, { fit: "cover" })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);
    }

    fs.unlinkSync(srcPath);
  }

  console.log(`Done: profile images optimized.`);
}

async function optimizePostImages(): Promise<void> {
  const imagesDir = path.join(PUBLIC_PATH, "images");
  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => f.endsWith(".jpg") && !fs.statSync(path.join(imagesDir, f)).isDirectory());

  console.log(`Optimizing ${files.length} post images...`);

  for (const file of files) {
    const id = path.basename(file, ".jpg");
    const srcPath = path.join(imagesDir, file);

    for (const width of POST_SIZES) {
      const outPath = path.join(imagesDir, `${id}-${width}w.webp`);
      await sharp(srcPath)
        .resize(width, undefined, { withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);
    }

    fs.unlinkSync(srcPath);
  }

  console.log(`Done: post images optimized.`);
}

async function main(): Promise<void> {
  await optimizeProfileImages();
  await optimizePostImages();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
