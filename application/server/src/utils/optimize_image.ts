import sharp, { type Metadata } from "sharp";

export const OPTIMIZED_IMAGE_EXTENSION = "webp";
export const OPTIMIZED_IMAGE_MAX_WIDTH = 500;

const WEBP_QUALITY = 82;
const OPTIMIZABLE_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function isOptimizableImageExtension(extension: string): boolean {
  return OPTIMIZABLE_IMAGE_EXTENSIONS.has(extension.toLowerCase());
}

export async function readImageMetadata(input: Buffer): Promise<Metadata> {
  return sharp(input, { failOn: "warning" }).metadata();
}

export async function optimizeImageToWebp(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: "warning" })
    .keepMetadata()
    .resize({
      fit: "inside",
      width: OPTIMIZED_IMAGE_MAX_WIDTH,
      withoutEnlargement: true,
    })
    .webp({
      effort: 6,
      quality: WEBP_QUALITY,
    })
    .toBuffer();
}
