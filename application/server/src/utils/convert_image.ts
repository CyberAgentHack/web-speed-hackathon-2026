import exifReader from "exif-reader";
import sharp from "sharp";

interface ConvertImageResult {
  buffer: Buffer;
  alt: string;
}

function readTiffImageDescription(buf: Buffer): string | undefined {
  if (buf.length < 8) return undefined;

  const byteOrder = buf.readUInt16BE(0);
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return undefined;

  const isBE = byteOrder === 0x4d4d;
  const readU16 = (offset: number) => (isBE ? buf.readUInt16BE(offset) : buf.readUInt16LE(offset));
  const readU32 = (offset: number) => (isBE ? buf.readUInt32BE(offset) : buf.readUInt32LE(offset));

  if (readU16(2) !== 42) return undefined;

  const ifdOffset = readU32(4);
  if (ifdOffset + 2 > buf.length) return undefined;

  const numEntries = readU16(ifdOffset);

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > buf.length) break;

    const tag = readU16(entryOffset);
    if (tag === 270) {
      const count = readU32(entryOffset + 4);
      if (count <= 4) {
        return buf.slice(entryOffset + 8, entryOffset + 8 + count - 1).toString("utf8");
      }
      const valueOffset = readU32(entryOffset + 8);
      if (valueOffset + count > buf.length) return undefined;
      return buf.slice(valueOffset, valueOffset + count - 1).toString("utf8");
    }
  }
  return undefined;
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

  if (imageDescription == null) {
    try {
      imageDescription = readTiffImageDescription(input);
    } catch {
      // ignore TIFF tag extraction errors
    }
  }

  let pipeline = sharp(input).jpeg({ quality: 90 });

  if (imageDescription != null) {
    pipeline = pipeline.withExif({
      IFD0: { ImageDescription: imageDescription },
    });
  }

  return { buffer: await pipeline.toBuffer(), alt: imageDescription ?? "" };
}
