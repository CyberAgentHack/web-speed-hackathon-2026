import { promises as fs } from "node:fs";
import path from "node:path";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import {
  writeProfileImageVariants,
  writeResponsiveImageVariants,
} from "@web-speed-hackathon-2026/server/src/utils/image_variants";

async function collectImages(directory: string) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.jpg$/i.test(name))
    .filter((name) => /-\d+\.jpg$/i.test(name) === false);
}

async function processDirectory(directory: string) {
  try {
    const imageNames = await collectImages(directory);

    for (const imageName of imageNames) {
      const imageId = path.basename(imageName, ".jpg");
      const filePath = path.resolve(directory, imageName);
      const input = await fs.readFile(filePath);
      await writeResponsiveImageVariants(input, directory, imageId);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}

await processDirectory(path.resolve(PUBLIC_PATH, "images"));
await processDirectory(path.resolve(UPLOAD_PATH, "images"));

async function processProfileDirectory(directory: string) {
  try {
    const imageNames = await collectImages(directory);

    for (const imageName of imageNames) {
      const imageId = path.basename(imageName, ".jpg");
      const filePath = path.resolve(directory, imageName);
      const input = await fs.readFile(filePath);
      await writeProfileImageVariants(input, directory, imageId);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}

await processProfileDirectory(path.resolve(PUBLIC_PATH, "images/profiles"));
await processProfileDirectory(path.resolve(UPLOAD_PATH, "images/profiles"));
