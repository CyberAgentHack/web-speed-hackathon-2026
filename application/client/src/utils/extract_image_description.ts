function findImageDescriptionInIfd(buffer: ArrayBuffer, tiffStart: number): string {
  const view = new DataView(buffer);
  const byteOrder = view.getUint16(tiffStart);
  const le = byteOrder === 0x4949;

  const ifdOffset = view.getUint32(tiffStart + 4, le);
  const numEntries = view.getUint16(tiffStart + ifdOffset, le);

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, le);

    if (tag === 0x010e) {
      const count = view.getUint32(entryOffset + 4, le);
      const valueOffset =
        count <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, le);
      const bytes = new Uint8Array(buffer, valueOffset, count);
      const trimmed = bytes[bytes.length - 1] === 0 ? bytes.slice(0, -1) : bytes;
      return new TextDecoder("utf-8").decode(trimmed);
    }
  }

  return "";
}

export async function extractImageDescription(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  const header = view.getUint16(0);

  // TIFF: starts with "II" (0x4949) or "MM" (0x4D4D)
  if (header === 0x4949 || header === 0x4d4d) {
    return findImageDescriptionInIfd(buffer, 0);
  }

  // JPEG: starts with 0xFFD8
  if (header !== 0xffd8) return "";

  let pos = 2;
  while (pos < view.byteLength - 1) {
    if (view.getUint8(pos) !== 0xff) break;
    const marker = view.getUint8(pos + 1);

    if (marker === 0xe1) {
      const app1Start = pos + 4;

      // Check "Exif\0\0"
      if (
        view.getUint32(app1Start) === 0x45786966 &&
        view.getUint16(app1Start + 4) === 0x0000
      ) {
        return findImageDescriptionInIfd(buffer, app1Start + 6);
      }
      return "";
    }

    if (marker === 0xda || marker === 0xd9) break;
    pos += 2 + view.getUint16(pos + 2);
    continue;
  }

  return "";
}
