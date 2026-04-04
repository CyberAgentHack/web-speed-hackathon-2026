import { promises as fs } from "fs";
import path from "path";

interface ExtractedAlt {
  alt: string;
//   filePath: string;
  relativePath: string;
}

const JPEG_EXTENSIONS = new Set([".jpg", ".jpeg"]);
const EXIF_MARKER = 0xe1;
const IMAGE_DESCRIPTION_TAG = 0x010e;
const TIFF_TYPE_ASCII = 2;

function readUInt16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function readUInt32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

function getTypeUnitSize(type: number): number {
  switch (type) {
    case 1:
    case 2:
    case 6:
    case 7:
      return 1;
    case 3:
    case 8:
      return 2;
    case 4:
    case 9:
    case 11:
      return 4;
    case 5:
    case 10:
    case 12:
      return 8;
    default:
      return 0;
  }
}

function decodeExifString(bytes: Uint8Array): string {
  const trimmed = bytes.subarray(0, bytes.lastIndexOf(0) >= 0 ? bytes.lastIndexOf(0) : bytes.length);
  return new TextDecoder().decode(trimmed).trim();
}

function extractImageDescription(buffer: Uint8Array): string | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const segmentLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
    if (segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
      break;
    }

    if (marker === EXIF_MARKER) {
      const segmentStart = offset + 4;
      const exifHeader = buffer.subarray(segmentStart, segmentStart + 6);
      if (
        exifHeader[0] === 0x45 &&
        exifHeader[1] === 0x78 &&
        exifHeader[2] === 0x69 &&
        exifHeader[3] === 0x66 &&
        exifHeader[4] === 0x00 &&
        exifHeader[5] === 0x00
      ) {
        const tiffStart = segmentStart + 6;
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const byteOrder = String.fromCharCode(buffer[tiffStart] ?? 0, buffer[tiffStart + 1] ?? 0);
        const littleEndian = byteOrder === "II";
        const isBigEndian = byteOrder === "MM";
        if (!littleEndian && !isBigEndian) {
          return null;
        }

        const ifd0Offset = readUInt32(view, tiffStart + 4, littleEndian);
        const ifd0Start = tiffStart + ifd0Offset;
        if (ifd0Start + 2 > buffer.length) {
          return null;
        }

        const entryCount = readUInt16(view, ifd0Start, littleEndian);
        for (let index = 0; index < entryCount; index += 1) {
          const entryOffset = ifd0Start + 2 + index * 12;
          if (entryOffset + 12 > buffer.length) {
            return null;
          }

          const tag = readUInt16(view, entryOffset, littleEndian);
          if (tag !== IMAGE_DESCRIPTION_TAG) {
            continue;
          }

          const type = readUInt16(view, entryOffset + 2, littleEndian);
          const count = readUInt32(view, entryOffset + 4, littleEndian);
          const unitSize = getTypeUnitSize(type);
          if (type !== TIFF_TYPE_ASCII || unitSize === 0 || count === 0) {
            return null;
          }

          const byteLength = unitSize * count;
          let valueBytes: Uint8Array;
          if (byteLength <= 4) {
            valueBytes = buffer.subarray(entryOffset + 8, entryOffset + 8 + byteLength);
          } else {
            const valueOffset = readUInt32(view, entryOffset + 8, littleEndian);
            const valueStart = tiffStart + valueOffset;
            if (valueStart + byteLength > buffer.length) {
              return null;
            }
            valueBytes = buffer.subarray(valueStart, valueStart + byteLength);
          }

          const decoded = decodeExifString(valueBytes);
          return decoded === "" ? null : decoded;
        }
      }
    }

    offset += 2 + segmentLength;
  }

  return null;
}

async function collectJpegs(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.resolve(dirPath, entry.name);
      if (entry.isDirectory()) {
        return collectJpegs(fullPath);
      }
      if (JPEG_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        return [fullPath];
      }
      return [];
    }),
  );

  return nested.flat();
}

async function main() {
  const publicPath = path.resolve(process.cwd(), "../public/images/profiles");
  const jpegPaths = await collectJpegs(publicPath);

  const extracted = await Promise.all(
    jpegPaths.map(async (filePath) => {
      const buffer = await fs.readFile(filePath);
      const alt = extractImageDescription(new Uint8Array(buffer));
      if (alt == null) {
        return null;
      }

      return {
        alt,
        // filePath,
        relativePath:path.relative(publicPath, filePath).split("/")[1] && path.relative(publicPath, filePath).split("/")[1].split(".")[0],
      } satisfies ExtractedAlt;
    }),
  );

  const results = extracted.filter((item): item is ExtractedAlt => item !== null);
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});