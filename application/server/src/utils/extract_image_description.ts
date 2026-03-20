/**
 * Extract TIFF ImageDescription tag from a TIFF file buffer.
 * Returns the description string, or empty string if not found.
 */
export function extractImageDescription(buf: Buffer): string {
  // Check TIFF magic bytes
  const bo = buf.readUInt16BE(0);
  const le = bo === 0x4949; // II = little-endian
  const be = bo === 0x4D4D; // MM = big-endian

  if (!le && !be) {
    return "";
  }

  const readUInt16 = (offset: number) => (le ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset));
  const readUInt32 = (offset: number) => (le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset));

  try {
    const ifd0Offset = readUInt32(4);
    const numEntries = readUInt16(ifd0Offset);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0Offset + 2 + i * 12;
      const tag = readUInt16(entryOffset);

      // 0x010E = ImageDescription
      if (tag === 0x010e) {
        const count = readUInt32(entryOffset + 4);
        const valueOffset = readUInt32(entryOffset + 8);
        // Remove null terminator
        return buf.slice(valueOffset, valueOffset + count - 1).toString("utf8");
      }
    }
  } catch {
    // Parsing error
  }

  return "";
}
