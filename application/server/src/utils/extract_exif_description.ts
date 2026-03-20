/**
 * JPEG バイナリから EXIF の ImageDescription (tag 0x010E) を抽出する。
 * 外部ライブラリ不要の最小限パーサー。
 */
export function extractExifDescription(jpeg: Buffer): string {
  // SOI チェック
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return "";

  let pos = 2;
  while (pos < jpeg.length - 1) {
    if (jpeg[pos] !== 0xff) return "";
    const marker = jpeg[pos + 1]!;

    // SOS or EOI に達したら終了
    if (marker === 0xda || marker === 0xd9) return "";

    const segLen = jpeg.readUInt16BE(pos + 2);

    // APP1 (EXIF)
    if (marker === 0xe1) {
      const exifHeader = jpeg.toString("ascii", pos + 4, pos + 8);
      if (exifHeader === "Exif") {
        const tiffStart = pos + 10; // "Exif\0\0" の後
        return parseTiffDescription(jpeg, tiffStart);
      }
    }

    pos += 2 + segLen;
  }
  return "";
}

function parseTiffDescription(buf: Buffer, tiffStart: number): string {
  const byteOrder = buf.toString("ascii", tiffStart, tiffStart + 2);
  const isLE = byteOrder === "II";

  const readU16 = (off: number) =>
    isLE ? buf.readUInt16LE(tiffStart + off) : buf.readUInt16BE(tiffStart + off);
  const readU32 = (off: number) =>
    isLE ? buf.readUInt32LE(tiffStart + off) : buf.readUInt32BE(tiffStart + off);

  const ifdOffset = readU32(4);
  const entryCount = readU16(ifdOffset);

  for (let i = 0; i < entryCount; i++) {
    const entryOff = ifdOffset + 2 + i * 12;
    const tag = readU16(entryOff);

    if (tag === 0x010e) {
      // ImageDescription
      const count = readU32(entryOff + 4);
      const valueOffset = count <= 4 ? entryOff + 8 : readU32(entryOff + 8);
      // null terminator を除いた文字列を返す
      const raw = buf.toString("utf8", tiffStart + valueOffset, tiffStart + valueOffset + count);
      return raw.replace(/\0+$/, "");
    }
  }
  return "";
}
