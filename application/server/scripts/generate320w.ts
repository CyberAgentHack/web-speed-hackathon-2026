import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const PUBLIC_PATH = path.resolve(import.meta.dirname, "../../public");
const WEBP_QUALITY = 80;

async function main(): Promise<void> {
  const imagesDir = path.join(PUBLIC_PATH, "images");
  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => f.endsWith("-640w.webp") && fs.statSync(path.join(imagesDir, f)).isFile());

  console.log(`Generating 320w variants for ${files.length} images...`);

  for (const file of files) {
    const id = file.replace("-640w.webp", "");
    const srcPath = path.join(imagesDir, file);
    const outPath = path.join(imagesDir, `${id}-320w.webp`);

    if (fs.existsSync(outPath)) {
      continue;
    }

    await sharp(srcPath).resize(320, undefined, { withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toFile(outPath);
    console.log(`  Created: ${id}-320w.webp`);
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
