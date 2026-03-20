export function extractImageDescription(inputBuffer: Buffer): string {
  if (inputBuffer.byteLength < 8) {
    return "";
  }

  const byteOrderMark = inputBuffer.toString("ascii", 0, 2);
  const isLittleEndian = byteOrderMark === "II";
  const isBigEndian = byteOrderMark === "MM";

  if (!isLittleEndian && !isBigEndian) {
    return "";
  }

  const readUInt16 = (offset: number) =>
    isLittleEndian ? inputBuffer.readUInt16LE(offset) : inputBuffer.readUInt16BE(offset);
  const readUInt32 = (offset: number) =>
    isLittleEndian ? inputBuffer.readUInt32LE(offset) : inputBuffer.readUInt32BE(offset);

  if (readUInt16(2) !== 42) {
    return "";
  }

  const ifdOffset = readUInt32(4);
  if (ifdOffset <= 0 || ifdOffset + 2 > inputBuffer.byteLength) {
    return "";
  }

  const entryCount = readUInt16(ifdOffset);
  const asciiTag = 0x010e;

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > inputBuffer.byteLength) {
      return "";
    }

    const tag = readUInt16(entryOffset);
    if (tag !== asciiTag) {
      continue;
    }

    const type = readUInt16(entryOffset + 2);
    const count = readUInt32(entryOffset + 4);

    // TIFF ASCII
    if (type !== 2 || count === 0) {
      return "";
    }

    const valueOffset = entryOffset + 8;
    const descriptionOffset = count <= 4 ? valueOffset : readUInt32(valueOffset);

    if (descriptionOffset < 0 || descriptionOffset + count > inputBuffer.byteLength) {
      return "";
    }

    return inputBuffer
      .subarray(descriptionOffset, descriptionOffset + count)
      .toString("utf8")
      .replace(/\0+$/u, "")
      .trim();
  }

  return "";
}
