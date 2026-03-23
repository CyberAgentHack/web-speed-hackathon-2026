import * as iconv from "iconv-lite";

interface WavMetadata {
  artist?: string;
  title?: string;
}

/**
 * Extract IART (artist) and INAM (title) from WAV INFO chunk.
 * Handles Shift-JIS encoded metadata.
 */
export function extractWavMetadata(buf: Buffer): WavMetadata {
  const result: WavMetadata = {};

  try {
    // Skip RIFF header (4 + 4 + 4 = 12 bytes)
    let offset = 12;

    while (offset < buf.length - 8) {
      const chunkId = buf.toString("ascii", offset, offset + 4);
      const chunkSize = buf.readUInt32LE(offset + 4);

      if (chunkId === "LIST") {
        const listType = buf.toString("ascii", offset + 8, offset + 12);
        if (listType === "INFO") {
          let infoOffset = offset + 12;
          const infoEnd = offset + 8 + chunkSize;

          while (infoOffset < infoEnd - 8) {
            const tagId = buf.toString("ascii", infoOffset, infoOffset + 4);
            const tagSize = buf.readUInt32LE(infoOffset + 4);
            const tagData = buf.slice(infoOffset + 8, infoOffset + 8 + tagSize);
            // Remove null terminator
            const cleanData = tagData[tagData.length - 1] === 0 ? tagData.slice(0, -1) : tagData;
            const decoded = iconv.decode(cleanData, "Shift_JIS");

            if (tagId === "IART") {
              result.artist = decoded;
            } else if (tagId === "INAM") {
              result.title = decoded;
            }

            infoOffset += 8 + tagSize;
            if (tagSize % 2 !== 0) infoOffset++; // Padding
          }
        }
      }

      offset += 8 + chunkSize;
      if (chunkSize % 2 !== 0) offset++; // Padding
    }
  } catch {
    // Parsing error
  }

  return result;
}
