import exifReader from "exif-reader";
import sharp from "sharp";

export interface ImageMetadata {
  alt: string;
  width: number;
  height: number;
}

export async function extractImageMetadata(input: Buffer | string): Promise<ImageMetadata> {
  const metadata = await sharp(input).metadata();

  let alt = "";
  if (metadata.exif) {
    try {
      const exif = exifReader(metadata.exif);
      const desc = exif.Image?.ImageDescription;
      if (Buffer.isBuffer(desc)) {
        alt = new TextDecoder("utf-8").decode(desc).replace(/\0/g, "");
      } else if (typeof desc === "string") {
        alt = desc.replace(/\0/g, "");
      }
    } catch {
      // EXIF parse failure — keep alt as ""
    }
  }

  return {
    alt,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}
