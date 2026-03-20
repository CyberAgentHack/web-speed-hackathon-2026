import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const PUBLIC_PATH = path.resolve(import.meta.dirname, "../../public");
const IMAGES_DIR = path.join(PUBLIC_PATH, "images");
const PROFILES_DIR = path.join(IMAGES_DIR, "profiles");

async function convertDir(dir: string) {
  const files = fs.readdirSync(dir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
  let converted = 0;
  for (const file of files) {
    const src = path.join(dir, file);
    const dest = path.join(dir, file.replace(/\.(jpg|jpeg|png)$/i, ".avif"));
    if (fs.existsSync(dest)) {
      continue;
    }
    await sharp(src).avif({ quality: 63, effort: 4 }).toFile(dest);
    const srcSize = fs.statSync(src).size;
    const destSize = fs.statSync(dest).size;
    console.log(
      `${file} → .avif (${srcSize} → ${destSize}, ${Math.round((1 - destSize / srcSize) * 100)}% smaller)`,
    );
    converted++;
  }
  return converted;
}

console.log("Converting images to AVIF...");
const c1 = await convertDir(IMAGES_DIR);
const c2 = await convertDir(PROFILES_DIR);
console.log(`Done. Converted ${c1 + c2} images.`);
