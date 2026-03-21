function getAsciiValue(view: DataView, offset: number, count: number): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, count);
  const lastNonNullIndex = bytes.lastIndexOf(0);
  const slice = lastNonNullIndex === -1 ? bytes : bytes.slice(0, lastNonNullIndex);
  return new TextDecoder().decode(slice);
}

function extractTiffImageDescription(bytes: Uint8Array): string {
  if (bytes.length < 8) {
    return "";
  }

  const byteOrderMarker = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0);
  const littleEndian = byteOrderMarker === "II";
  const bigEndian = byteOrderMarker === "MM";
  if (!littleEndian && !bigEndian) {
    return "";
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const getUint16 = (offset: number) => view.getUint16(offset, littleEndian);
  const getUint32 = (offset: number) => view.getUint32(offset, littleEndian);

  const firstIfdOffset = getUint32(4);
  if (firstIfdOffset + 2 > bytes.length) {
    return "";
  }

  const entryCount = getUint16(firstIfdOffset);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = firstIfdOffset + 2 + index * 12;
    if (entryOffset + 12 > bytes.length) {
      break;
    }

    const tag = getUint16(entryOffset);
    if (tag !== 0x010e) {
      continue;
    }

    const type = getUint16(entryOffset + 2);
    const count = getUint32(entryOffset + 4);
    if (type !== 2 || count === 0) {
      return "";
    }

    const valueOffset = count <= 4 ? entryOffset + 8 : getUint32(entryOffset + 8);
    if (valueOffset + count > bytes.length) {
      return "";
    }

    return getAsciiValue(view, valueOffset, count);
  }

  return "";
}

function extractJpegExif(bytes: Uint8Array): Uint8Array | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      break;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    if (length < 2 || offset + 2 + length > bytes.length) {
      break;
    }

    if (marker === 0xe1) {
      const segmentStart = offset + 4;
      const segmentEnd = offset + 2 + length;
      const segment = bytes.subarray(segmentStart, segmentEnd);
      const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
      const hasExifHeader = exifHeader.every((value, index) => segment[index] === value);
      if (hasExifHeader) {
        return segment.subarray(exifHeader.length);
      }
    }

    offset += 2 + length;
  }

  return null;
}

export function extractImageAlt(bytes: Uint8Array): string {
  const byteOrderMarker = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0);
  if (byteOrderMarker === "II" || byteOrderMarker === "MM") {
    return extractTiffImageDescription(bytes);
  }

  const exifBytes = extractJpegExif(bytes);
  if (exifBytes != null) {
    return extractTiffImageDescription(exifBytes);
  }

  return "";
}
