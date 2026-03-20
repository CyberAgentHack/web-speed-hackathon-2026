interface SoundMetadata {
  artist?: string;
  title?: string;
}

function parseRiffInfoChunk(buf: Buffer): { IART?: string; INAM?: string } {
  const result: { IART?: string; INAM?: string } = {};
  if (buf.length < 12) return result;
  if (buf.toString("ascii", 0, 4) !== "RIFF") return result;
  if (buf.toString("ascii", 8, 12) !== "WAVE") return result;

  const dec = new TextDecoder("shift-jis");
  let i = 12;
  while (i < buf.length - 8) {
    const chunkId = buf.toString("ascii", i, i + 4);
    const chunkSize = buf.readUInt32LE(i + 4);
    if (chunkId === "LIST" && i + 12 <= buf.length) {
      const listType = buf.toString("ascii", i + 8, i + 12);
      if (listType === "INFO") {
        let j = i + 12;
        const end = Math.min(i + 8 + chunkSize, buf.length);
        while (j < end - 8) {
          const tagId = buf.toString("ascii", j, j + 4);
          const tagSize = buf.readUInt32LE(j + 4);
          if (tagSize > 0 && j + 8 + tagSize <= buf.length) {
            const tagData = buf.slice(j + 8, j + 8 + tagSize);
            // Remove null terminator
            const trimmed = tagData[tagData.length - 1] === 0 ? tagData.slice(0, -1) : tagData;
            const value = dec.decode(trimmed);
            if (tagId === "IART") result.IART = value;
            if (tagId === "INAM") result.INAM = value;
          }
          j += 8 + tagSize + (tagSize % 2);
        }
      }
    }
    i += 8 + chunkSize + (chunkSize % 2);
  }
  return result;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    const info = parseRiffInfoChunk(data);
    return {
      artist: info.IART,
      title: info.INAM,
    };
  } catch {
    return {
      artist: undefined,
      title: undefined,
    };
  }
}
