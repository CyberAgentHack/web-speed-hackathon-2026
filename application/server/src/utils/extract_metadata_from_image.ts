const JPEG_SOI_MARKER = 0xffd8;
const JPEG_EOI_MARKER = 0xffd9;
const JPEG_APP1_MARKER = 0xffe1;
const EXIF_HEADER = "Exif\0\0";
const IMAGE_DESCRIPTION_TAG = 0x010e;
const TIFF_TYPE_ASCII = 2;

function getAsciiString(data: Uint8Array): string {
  return new TextDecoder("utf-8").decode(data).replace(/\0+$/, "");
}

function equalsBytes(data: Uint8Array, text: string): boolean {
  if (data.byteLength < text.length) {
    return false;
  }

  for (let index = 0; index < text.length; index += 1) {
    if ((data[index] ?? -1) !== text.charCodeAt(index)) {
      return false;
    }
  }

  return true;
}

function readUInt16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function readUInt32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

function extractExifSegment(data: Uint8Array): Uint8Array | null {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (readUInt16(view, 0, false) !== JPEG_SOI_MARKER) {
    return null;
  }

  let offset = 2;
  while (offset + 4 <= data.byteLength) {
    const marker = readUInt16(view, offset, false);
    if (marker === JPEG_EOI_MARKER) {
      return null;
    }

    if ((marker & 0xff00) !== 0xff00) {
      return null;
    }

    const segmentLength = readUInt16(view, offset + 2, false);
    if (segmentLength < 2) {
      return null;
    }

    const segmentStart = offset + 4;
    const segmentEnd = offset + 2 + segmentLength;
    if (segmentEnd > data.byteLength) {
      return null;
    }

    if (marker === JPEG_APP1_MARKER) {
      const segment = data.subarray(segmentStart, segmentEnd);
      if (equalsBytes(segment.subarray(0, EXIF_HEADER.length), EXIF_HEADER)) {
        return segment.subarray(EXIF_HEADER.length);
      }
    }

    offset = segmentEnd;
  }

  return null;
}

export function extractMetadataFromImage(data: Uint8Array): { alt: string } {
  const exifSegment = extractExifSegment(data);
  if (exifSegment == null || exifSegment.byteLength < 8) {
    return { alt: "" };
  }

  const view = new DataView(exifSegment.buffer, exifSegment.byteOffset, exifSegment.byteLength);
  const byteOrder = String.fromCharCode(exifSegment[0] ?? 0, exifSegment[1] ?? 0);
  const littleEndian = byteOrder === "II";
  if (!littleEndian && byteOrder !== "MM") {
    return { alt: "" };
  }

  const ifdOffset = readUInt32(view, 4, littleEndian);
  if (ifdOffset + 2 > exifSegment.byteLength) {
    return { alt: "" };
  }

  const entryCount = readUInt16(view, ifdOffset, littleEndian);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > exifSegment.byteLength) {
      return { alt: "" };
    }

    const tag = readUInt16(view, entryOffset, littleEndian);
    if (tag !== IMAGE_DESCRIPTION_TAG) {
      continue;
    }

    const type = readUInt16(view, entryOffset + 2, littleEndian);
    const count = readUInt32(view, entryOffset + 4, littleEndian);
    if (type !== TIFF_TYPE_ASCII || count === 0) {
      return { alt: "" };
    }

    if (count <= 4) {
      const valueStart = entryOffset + 8;
      return { alt: getAsciiString(exifSegment.subarray(valueStart, valueStart + count)) };
    }

    const valueOffset = readUInt32(view, entryOffset + 8, littleEndian);
    if (valueOffset + count > exifSegment.byteLength) {
      return { alt: "" };
    }

    return {
      alt: getAsciiString(exifSegment.subarray(valueOffset, valueOffset + count)),
    };
  }

  return { alt: "" };
}
