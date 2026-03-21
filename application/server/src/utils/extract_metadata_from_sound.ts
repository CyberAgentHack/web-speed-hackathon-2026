import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

const RIFF_CHUNK_HEADER_SIZE = 8;
const RIFF_INFO_LIST_TYPE_SIZE = 4;
const NULL_CHARACTER = "\u0000";
const SUSPICIOUS_METADATA_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\uFFFD]/;

function sanitizeMetadataValue(value: string | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  const sanitized = value.replaceAll(NULL_CHARACTER, "").trim();
  return sanitized === "" ? undefined : sanitized;
}

function isSuspiciousMetadataValue(value: string | undefined): boolean {
  return value != null && SUSPICIOUS_METADATA_PATTERN.test(value);
}

function decodeRiffInfoValue(data: Buffer): string | undefined {
  const end = data.indexOf(0);
  const value = data.subarray(0, end >= 0 ? end : data.length);
  return sanitizeMetadataValue(new TextDecoder("shift_jis").decode(value));
}

function readRiffInfoTag(data: Buffer, targetTag: string): string | undefined {
  if (
    data.length < 12 ||
    data.toString("ascii", 0, 4) !== "RIFF" ||
    data.toString("ascii", 8, 12) !== "WAVE"
  ) {
    return undefined;
  }

  let offset = 12;
  while (offset + RIFF_CHUNK_HEADER_SIZE <= data.length) {
    const chunkId = data.toString("ascii", offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);
    const chunkDataStart = offset + RIFF_CHUNK_HEADER_SIZE;
    const chunkDataEnd = Math.min(chunkDataStart + chunkSize, data.length);

    if (
      chunkId === "LIST" &&
      chunkDataEnd - chunkDataStart >= RIFF_INFO_LIST_TYPE_SIZE &&
      data.toString("ascii", chunkDataStart, chunkDataStart + RIFF_INFO_LIST_TYPE_SIZE) === "INFO"
    ) {
      let infoOffset = chunkDataStart + RIFF_INFO_LIST_TYPE_SIZE;

      while (infoOffset + RIFF_CHUNK_HEADER_SIZE <= chunkDataEnd) {
        const infoId = data.toString("ascii", infoOffset, infoOffset + 4);
        const infoSize = data.readUInt32LE(infoOffset + 4);
        const infoDataStart = infoOffset + RIFF_CHUNK_HEADER_SIZE;
        const infoDataEnd = Math.min(infoDataStart + infoSize, chunkDataEnd);

        if (infoId === targetTag) {
          return decodeRiffInfoValue(data.subarray(infoDataStart, infoDataEnd));
        }

        infoOffset = infoDataEnd + (infoSize % 2);
      }
    }

    offset = chunkDataEnd + (chunkSize % 2);
  }

  return undefined;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    const metadata = await MusicMetadata.parseBuffer(data);
    const artist = sanitizeMetadataValue(metadata.common.artist);
    const title = sanitizeMetadataValue(metadata.common.title);

    return {
      artist:
        artist != null && !isSuspiciousMetadataValue(artist) ? artist : readRiffInfoTag(data, "IART"),
      title:
        title != null && !isSuspiciousMetadataValue(title) ? title : readRiffInfoTag(data, "INAM"),
    };
  } catch {
    return {
      artist: readRiffInfoTag(data, "IART"),
      title: readRiffInfoTag(data, "INAM"),
    };
  }
}
