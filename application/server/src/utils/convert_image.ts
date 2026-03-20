import sharp from "sharp";

interface Options {
  maxWidth?: number;
  quality?: number;
}

export async function convertImageToWebP(inputBuffer: Buffer, options: Options = {}): Promise<Buffer> {
  const pipeline = sharp(inputBuffer);

  if (options.maxWidth != null) {
    pipeline.resize({
      fit: "inside",
      width: options.maxWidth,
      withoutEnlargement: true,
    });
  }

  return pipeline
    .webp({ quality: options.quality ?? 80 })
    .withMetadata()
    .toBuffer();
}
