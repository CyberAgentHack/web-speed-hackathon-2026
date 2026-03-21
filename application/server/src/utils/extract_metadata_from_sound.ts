import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string | undefined;
  title?: string | undefined;
}

function decodeRiffString(bytes: Uint8Array): string {
  // Strip trailing null bytes
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  const trimmed = bytes.subarray(0, end);
  if (trimmed.length === 0) return "";

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(trimmed);
  } catch {
    return new TextDecoder("shift_jis").decode(trimmed);
  }
}

function parseRiffInfoMetadata(data: Buffer): SoundMetadata | null {
  // Verify RIFF/WAVE header
  if (data.length < 12) return null;
  const riff = data.subarray(0, 4).toString("ascii");
  const wave = data.subarray(8, 12).toString("ascii");
  if (riff !== "RIFF" || wave !== "WAVE") return null;

  let title: string | undefined;
  let artist: string | undefined;

  // Walk top-level chunks starting at offset 12
  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunkId = data.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = data.readUInt32LE(offset + 4);

    if (chunkId === "LIST" && offset + 12 <= data.length) {
      const listType = data.subarray(offset + 8, offset + 12).toString("ascii");
      if (listType === "INFO") {
        // Parse INFO sub-chunks
        let subOffset = offset + 12;
        const listEnd = offset + 8 + chunkSize;
        while (subOffset + 8 <= listEnd && subOffset + 8 <= data.length) {
          const subId = data.subarray(subOffset, subOffset + 4).toString("ascii");
          const subSize = data.readUInt32LE(subOffset + 4);
          const valueEnd = Math.min(subOffset + 8 + subSize, data.length);
          const valueBytes = data.subarray(subOffset + 8, valueEnd);

          if (subId === "INAM") {
            title = decodeRiffString(valueBytes);
          } else if (subId === "IART") {
            artist = decodeRiffString(valueBytes);
          }

          // Advance to next sub-chunk (word-aligned)
          subOffset += 8 + subSize;
          if (subSize % 2 !== 0) subOffset++;
        }
        break;
      }
    }

    // Advance to next chunk (word-aligned)
    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  if (title === undefined && artist === undefined) return null;
  return { title, artist };
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  // For WAV files, parse RIFF INFO directly to handle Shift_JIS encoding
  const riffResult = parseRiffInfoMetadata(data);
  if (riffResult !== null) {
    return riffResult;
  }

  // Fall back to music-metadata for other formats (MP3, etc.)
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
