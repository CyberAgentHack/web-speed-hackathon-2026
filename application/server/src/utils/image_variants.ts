import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

export const IMAGE_JPEG_QUALITY = 82;
export const IMAGE_WEBP_QUALITY = 80;
export const IMAGE_MAX_WIDTH = 1280;
export const IMAGE_RESPONSIVE_WIDTHS = [320, 640] as const;
export const PROFILE_IMAGE_MAX_WIDTH = 128;
export const PROFILE_IMAGE_RESPONSIVE_WIDTHS = [64, 128] as const;

function getVariantSuffix(width?: number) {
  return width === undefined ? "" : `-${width}`;
}

export function getImageVariantPath(
  outputDir: string,
  imageId: string,
  extension: "jpg" | "webp",
  width?: number,
) {
  return path.resolve(outputDir, `${imageId}${getVariantSuffix(width)}.${extension}`);
}

export async function writeResponsiveImageVariants(
  input: Buffer,
  outputDir: string,
  imageId: string,
) {
  return writeImageVariants(input, outputDir, imageId, {
    maxWidth: IMAGE_MAX_WIDTH,
    responsiveWidths: IMAGE_RESPONSIVE_WIDTHS,
  });
}

export async function writeProfileImageVariants(
  input: Buffer,
  outputDir: string,
  imageId: string,
) {
  return writeImageVariants(input, outputDir, imageId, {
    maxWidth: PROFILE_IMAGE_MAX_WIDTH,
    responsiveWidths: PROFILE_IMAGE_RESPONSIVE_WIDTHS,
  });
}

async function writeImageVariants(
  input: Buffer,
  outputDir: string,
  imageId: string,
  options: {
    maxWidth: number;
    responsiveWidths: readonly number[];
  },
) {
  await fs.mkdir(outputDir, { recursive: true });

  const source = sharp(input, { failOn: "none" }).rotate();

  await source
    .clone()
    .resize({ width: options.maxWidth, withoutEnlargement: true })
    .jpeg({ mozjpeg: true, quality: IMAGE_JPEG_QUALITY })
    .toFile(getImageVariantPath(outputDir, imageId, "jpg"));

  await source
    .clone()
    .resize({ width: options.maxWidth, withoutEnlargement: true })
    .webp({ quality: IMAGE_WEBP_QUALITY })
    .toFile(getImageVariantPath(outputDir, imageId, "webp"));

  await Promise.all(
    options.responsiveWidths.flatMap((width) => {
      return [
        source
          .clone()
          .resize({ width, withoutEnlargement: true })
          .jpeg({ mozjpeg: true, quality: IMAGE_JPEG_QUALITY })
          .toFile(getImageVariantPath(outputDir, imageId, "jpg", width)),
        source
          .clone()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: IMAGE_WEBP_QUALITY })
          .toFile(getImageVariantPath(outputDir, imageId, "webp", width)),
      ];
    }),
  );
}
