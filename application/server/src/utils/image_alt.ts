import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import sharp from "sharp";

import { Image, ProfileImage } from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { OPTIMIZED_IMAGE_EXTENSION } from "@web-speed-hackathon-2026/server/src/utils/optimize_image";

const require = createRequire(import.meta.url);
const { load, ImageIFD } = require("piexifjs") as typeof import("piexifjs");

function decodeImageDescription(binary: string): string {
  try {
    const exif = load(binary);
    const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
    return raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "";
  } catch {
    return "";
  }
}

export async function extractImageAlt(input: Buffer): Promise<string> {
  const directAlt = decodeImageDescription(input.toString("binary"));
  if (directAlt !== "") {
    return directAlt;
  }

  try {
    const metadata = await sharp(input, { failOn: "warning" }).metadata();
    if (metadata.exif == null) {
      return "";
    }

    return decodeImageDescription(`Exif\u0000\u0000${Buffer.from(metadata.exif).toString("binary")}`);
  } catch {
    return "";
  }
}

async function readAltFromImageFile(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return await extractImageAlt(data);
}

async function findExistingPath(paths: string[]): Promise<string | null> {
  for (const filePath of paths) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      continue;
    }
  }

  return null;
}

export async function backfillImageAlts(): Promise<void> {
  const images = await Image.findAll({ attributes: ["id"] });
  await Promise.all(
    images.map(async (image) => {
      const filePath = await findExistingPath([
        path.resolve(PUBLIC_PATH, "images", `${image.id}.${OPTIMIZED_IMAGE_EXTENSION}`),
        path.resolve(PUBLIC_PATH, "images", `${image.id}.jpg`),
        path.resolve(UPLOAD_PATH, "images", `${image.id}.${OPTIMIZED_IMAGE_EXTENSION}`),
        path.resolve(UPLOAD_PATH, "images", `${image.id}.jpg`),
      ]);
      if (filePath === null) {
        return;
      }

      const alt = await readAltFromImageFile(filePath);
      await image.update({ alt });
    }),
  );

  const profileImages = await ProfileImage.findAll({ attributes: ["id"] });
  await Promise.all(
    profileImages.map(async (profileImage) => {
      const filePath = await findExistingPath([
        path.resolve(PUBLIC_PATH, "images/profiles", `${profileImage.id}.${OPTIMIZED_IMAGE_EXTENSION}`),
        path.resolve(PUBLIC_PATH, "images/profiles", `${profileImage.id}.jpg`),
        path.resolve(UPLOAD_PATH, "images/profiles", `${profileImage.id}.${OPTIMIZED_IMAGE_EXTENSION}`),
        path.resolve(UPLOAD_PATH, "images/profiles", `${profileImage.id}.jpg`),
      ]);
      if (filePath === null) {
        return;
      }

      const alt = await readAltFromImageFile(filePath);
      await profileImage.update({ alt });
    }),
  );
}
