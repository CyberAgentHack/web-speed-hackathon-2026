import exifReader from "exif-reader";
import sharp from "sharp";

interface ConvertImageResult {
  buffer: Buffer;
  alt: string;
}

export async function convertImage(input: Buffer): Promise<ConvertImageResult> {
  let imageDescription: string | undefined;

  try {
    const metadata = await sharp(input).metadata();
    if (metadata.exif) {
      const exif = exifReader(metadata.exif);
      const desc = exif?.Image?.ImageDescription;
      if (typeof desc === "string") {
        imageDescription = desc;
      }
    }
  } catch {
    // ignore EXIF extraction errors
  }

  let pipeline = sharp(input).jpeg({ quality: 90 });

  if (imageDescription != null) {
    pipeline = pipeline.withExif({
      IFD0: { ImageDescription: imageDescription },
    });
  }

  return { buffer: await pipeline.toBuffer(), alt: imageDescription ?? "" };
}
