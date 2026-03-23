import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, extname, basename } from "node:path";

const require = createRequire(join(process.cwd(), "server/package.json"));
const sharp = require("sharp");

const PUBLIC_DIR = new URL("../public", import.meta.url).pathname;
const IMAGES_DIR = join(PUBLIC_DIR, "images");
const PROFILES_DIR = join(IMAGES_DIR, "profiles");

async function convertImages(dir, maxWidth, quality) {
  const files = await readdir(dir);
  const jpgs = files.filter((f) => extname(f) === ".jpg");
  let count = 0;

  for (const file of jpgs) {
    const input = join(dir, file);
    const name = basename(file, ".jpg");
    const webpOut = join(dir, `${name}.webp`);

    await sharp(input)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toFile(webpOut);

    count++;
  }

  return count;
}

console.log("Converting general images...");
const imgCount = await convertImages(IMAGES_DIR, 640, 75);
console.log(`  Converted ${imgCount} images to WebP (max 640px)`);

console.log("Converting profile images...");
const profCount = await convertImages(PROFILES_DIR, 128, 75);
console.log(`  Converted ${profCount} profile images to WebP (max 128px)`);

console.log("Done!");
