import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

function parseRiffInfoChunks(data: Buffer): SoundMetadata {
  // Check RIFF header
  if (data.toString("ascii", 0, 4) !== "RIFF") {
    return { artist: undefined, title: undefined };
  }

  const decoder = new TextDecoder("shift_jis");
  let artist: string | undefined;
  let title: string | undefined;

  // Scan for INFO LIST chunk and its sub-chunks (INAM, IART)
  let offset = 12; // Skip RIFF header (4) + size (4) + WAVE (4)
  while (offset < data.length - 8) {
    const chunkId = data.toString("ascii", offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);

    if (chunkId === "LIST") {
      const listType = data.toString("ascii", offset + 8, offset + 12);
      if (listType === "INFO") {
        // Parse INFO sub-chunks
        let infoOffset = offset + 12;
        const infoEnd = offset + 8 + chunkSize;
        while (infoOffset < infoEnd - 8) {
          const subId = data.toString("ascii", infoOffset, infoOffset + 4);
          const subSize = data.readUInt32LE(infoOffset + 4);
          const subData = data.subarray(infoOffset + 8, infoOffset + 8 + subSize);

          // Remove null terminator if present
          const trimmed = subData[subData.length - 1] === 0 ? subData.subarray(0, -1) : subData;

          if (subId === "INAM") {
            title = decoder.decode(trimmed);
          } else if (subId === "IART") {
            artist = decoder.decode(trimmed);
          }

          // Sub-chunks are word-aligned (2-byte boundary)
          infoOffset += 8 + subSize + (subSize % 2);
        }
      }
    }

    // Chunks are word-aligned
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return { artist, title };
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  // For WAV files, parse RIFF INFO chunks directly to handle Shift-JIS encoding
  if (data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF") {
    const riffMeta = parseRiffInfoChunks(data);
    if (riffMeta.title || riffMeta.artist) {
      return riffMeta;
    }
  }

  try {
    const metadata = await MusicMetadata.parseBuffer(data);
    return {
      artist: metadata.common.artist,
      title: metadata.common.title,
    };
  } catch {
    return {
      artist: undefined,
      title: undefined,
    };
  }
}
