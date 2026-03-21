import { ImageIFD, load } from "piexifjs";

function decodeExifString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes).replace(/\0+$/u, "");
}

function extractAltFromTiff(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  if (view.byteLength < 8) {
    return "";
  }

  const byteOrder = String.fromCharCode(view.getUint8(0), view.getUint8(1));
  const littleEndian = byteOrder === "II";
  if (!littleEndian && byteOrder !== "MM") {
    return "";
  }

  const readUint16 = (offset: number) => view.getUint16(offset, littleEndian);
  const readUint32 = (offset: number) => view.getUint32(offset, littleEndian);

  if (readUint16(2) !== 42) {
    return "";
  }

  const ifdOffset = readUint32(4);
  if (ifdOffset + 2 > view.byteLength) {
    return "";
  }

  const entryCount = readUint16(ifdOffset);
  const decoder = new TextDecoder();

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > view.byteLength) {
      break;
    }

    const tag = readUint16(entryOffset);
    if (tag !== 0x010e) {
      continue;
    }

    const type = readUint16(entryOffset + 2);
    const count = readUint32(entryOffset + 4);
    if (type !== 2 || count === 0) {
      return "";
    }

    let bytes: Uint8Array;
    if (count <= 4) {
      bytes = new Uint8Array(buffer.slice(entryOffset + 8, entryOffset + 8 + count));
    } else {
      const valueOffset = readUint32(entryOffset + 8);
      if (valueOffset + count > view.byteLength) {
        return "";
      }
      bytes = new Uint8Array(buffer.slice(valueOffset, valueOffset + count));
    }

    return decoder.decode(bytes).replace(/\0+$/u, "");
  }

  return "";
}

export async function extractAltFromImageFile(file: File): Promise<string> {
  try {
    const sourceBuffer = await file.arrayBuffer();
    if (
      file.type === "image/tiff" ||
      file.name.toLowerCase().endsWith(".tif") ||
      file.name.toLowerCase().endsWith(".tiff")
    ) {
      const tiffAlt = extractAltFromTiff(sourceBuffer);
      if (tiffAlt.length > 0) {
        return tiffAlt;
      }
    }

    const binary = new TextDecoder("latin1").decode(new Uint8Array(sourceBuffer));
    const exif = load(binary);
    const value = exif["0th"]?.[ImageIFD.ImageDescription];
    return decodeExifString(value);
  } catch {
    return "";
  }
}
