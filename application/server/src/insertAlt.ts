import { promises as fs } from "node:fs";
import path from "node:path";

import { exiftool } from "exiftool-vendored";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { ImageSeed } from "@web-speed-hackathon-2026/server/src/types/seed";

const __dirname = import.meta.dirname;

const IMAGE_DIR = path.resolve(PUBLIC_PATH, "images");
const IMAGES_JSONL_PATH = path.resolve(__dirname, "../seeds/images.jsonl");
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".webp", ".png", ".avif"];

async function main(): Promise<void> {
  const source = await fs.readFile(IMAGES_JSONL_PATH, "utf8");
  const lines = source.split("\n");
  const updatedLines: string[] = [];

  try {
    for (const [index, line] of lines.entries()) {
      const trimmedLine = line.trim();
      if (trimmedLine === "") {
        continue;
      }

      const image = JSON.parse(trimmedLine) as ImageSeed;
      const imagePath = await findImagePath(image.id);
      const alt = await getExifImageDescription(imagePath);

      updatedLines.push(
        JSON.stringify({
          ...image,
          alt: alt ?? "",
        }),
      );

      console.info(
        `[${index + 1}/${lines.length}] updated alt for ${image.id}: ${alt ?? "(empty)"}`,
      );
    }
  } finally {
    await exiftool.end();
  }

  await fs.writeFile(IMAGES_JSONL_PATH, `${updatedLines.join("\n")}\n`, "utf8");
}

async function findImagePath(id: string): Promise<string> {
  for (const extension of IMAGE_EXTENSIONS) {
    const imagePath = path.resolve(IMAGE_DIR, `${id}${extension}`);

    try {
      await fs.access(imagePath);
      return imagePath;
    } catch {
      // Try the next extension.
    }
  }

  throw new Error(`Image file not found for id: ${id}`);
}

async function getExifImageDescription(imagePath: string): Promise<string | undefined> {
  const tags = await exiftool.read(imagePath);
  const alt = tags.ImageDescription;

  if (typeof alt !== "string") {
    console.info(`No EXIF ImageDescription found: ${path.basename(imagePath)}`);
    return undefined;
  }

  const normalizedAlt = alt.trim();
  if (normalizedAlt === "") {
    console.info(`Empty EXIF ImageDescription found: ${path.basename(imagePath)}`);
    return undefined;
  }

  return normalizedAlt;
}

await main();
