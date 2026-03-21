import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const PUBLIC_PATH = path.resolve(import.meta.dirname, "../public");
const IMAGES_DIR = path.join(PUBLIC_PATH, "images");
const PROFILES_DIR = path.join(IMAGES_DIR, "profiles");
const OPTIMIZED_IMAGES_DIR = path.join(IMAGES_DIR, "optimized");
const OPTIMIZED_PROFILES_DIR = path.join(PROFILES_DIR, "optimized");
const METADATA_PATH = path.join(IMAGES_DIR, "metadata.json");

const IMAGE_WIDTHS = [640, 1280];
const PROFILE_SIZES = [64, 128];

async function optimizePostImages(): Promise<Record<string, { width: number; height: number }>> {
  fs.mkdirSync(OPTIMIZED_IMAGES_DIR, { recursive: true });

  const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith(".jpg"));
  const metadata: Record<string, { width: number; height: number }> = {};

  for (const file of files) {
    const id = path.basename(file, ".jpg");
    const inputPath = path.join(IMAGES_DIR, file);
    const image = sharp(inputPath);
    const meta = await image.metadata();

    metadata[id] = { width: meta.width!, height: meta.height! };

    for (const w of IMAGE_WIDTHS) {
      const outputPath = path.join(OPTIMIZED_IMAGES_DIR, `${id}-${w}w.webp`);
      await sharp(inputPath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);
    }

    console.log(`  post image: ${id}`);
  }

  return metadata;
}

async function optimizeProfileImages(): Promise<Record<string, { width: number; height: number }>> {
  fs.mkdirSync(OPTIMIZED_PROFILES_DIR, { recursive: true });

  const files = fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith(".jpg"));
  const metadata: Record<string, { width: number; height: number }> = {};

  for (const file of files) {
    const id = path.basename(file, ".jpg");
    const inputPath = path.join(PROFILES_DIR, file);
    const meta = await sharp(inputPath).metadata();

    metadata[id] = { width: meta.width!, height: meta.height! };

    for (const size of PROFILE_SIZES) {
      const outputPath = path.join(OPTIMIZED_PROFILES_DIR, `${id}-${size}.webp`);
      await sharp(inputPath)
        .resize({ width: size, height: size, fit: "cover" })
        .webp({ quality: 75 })
        .toFile(outputPath);
    }

    console.log(`  profile image: ${id}`);
  }

  return metadata;
}

async function main() {
  console.log("Optimizing post images...");
  const images = await optimizePostImages();

  console.log("Optimizing profile images...");
  const profileImages = await optimizeProfileImages();

  const metadataJson = { images, profileImages };
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadataJson, null, 2));

  console.log(`Done! Metadata written to ${METADATA_PATH}`);
  console.log(`  Post images: ${Object.keys(images).length}`);
  console.log(`  Profile images: ${Object.keys(profileImages).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
