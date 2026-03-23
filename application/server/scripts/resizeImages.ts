import { promises as fs } from "fs";
import path from "path";

import sharp from "sharp";

const PUBLIC_PATH = path.resolve(import.meta.dirname, "../../public");

const POST_IMAGE_WIDTHS = [320, 640, 1280];
const PROFILE_IMAGE_WIDTHS = [256];

async function resizeImages(dir: string, widths: number[]) {
  const files = await fs.readdir(dir);
  const originals = files.filter(
    (f) => f.endsWith(".webp") && !/_w\d+\.webp$/.test(f),
  );

  console.log(`Processing ${originals.length} images in ${dir}`);

  for (const file of originals) {
    const filePath = path.join(dir, file);
    const uuid = file.replace(".webp", "");
    const metadata = await sharp(filePath).metadata();
    const originalWidth = metadata.width ?? 0;

    for (const targetWidth of widths) {
      if (originalWidth <= targetWidth) {
        console.log(
          `  ${file}: skip ${targetWidth}w (original ${originalWidth}px)`,
        );
        continue;
      }

      const outPath = path.join(dir, `${uuid}_w${targetWidth}.webp`);
      await sharp(filePath)
        .resize(targetWidth)
        .webp({ quality: 80 })
        .toFile(outPath);

      const stat = await fs.stat(outPath);
      console.log(
        `  ${file}: ${targetWidth}w → ${(stat.size / 1024).toFixed(1)} KB`,
      );
    }
  }
}

await resizeImages(path.join(PUBLIC_PATH, "images"), POST_IMAGE_WIDTHS);
await resizeImages(
  path.join(PUBLIC_PATH, "images/profiles"),
  PROFILE_IMAGE_WIDTHS,
);

console.log("Done!");
