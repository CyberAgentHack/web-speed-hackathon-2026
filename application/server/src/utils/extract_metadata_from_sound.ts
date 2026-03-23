import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

const SHIFT_JIS_DECODER = new TextDecoder("shift_jis");

function trimNull(bytes: Uint8Array): Uint8Array {
  const nullIndex = bytes.indexOf(0);
  return nullIndex === -1 ? bytes : bytes.subarray(0, nullIndex);
}

function decodeWaveInfoText(bytes: Uint8Array): string | undefined {
  const trimmed = trimNull(bytes);
  if (trimmed.length === 0) {
    return undefined;
  }

  const decoded = SHIFT_JIS_DECODER.decode(trimmed).trim();
  return decoded === "" ? undefined : decoded;
}

function extractMetadataFromWaveInfo(data: Buffer): SoundMetadata | null {
  if (
    data.length < 12 ||
    data.toString("ascii", 0, 4) !== "RIFF" ||
    data.toString("ascii", 8, 12) !== "WAVE"
  ) {
    return null;
  }

  const metadata: SoundMetadata = {};
  let offset = 12;

  while (offset + 8 <= data.length) {
    const chunkId = data.toString("ascii", offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;
    const chunkDataEnd = Math.min(chunkDataStart + chunkSize, data.length);

    if (chunkId === "LIST" && chunkDataEnd - chunkDataStart >= 4) {
      const listType = data.toString("ascii", chunkDataStart, chunkDataStart + 4);
      if (listType === "INFO") {
        let infoOffset = chunkDataStart + 4;
        while (infoOffset + 8 <= chunkDataEnd) {
          const infoId = data.toString("ascii", infoOffset, infoOffset + 4);
          const infoSize = data.readUInt32LE(infoOffset + 4);
          const infoDataStart = infoOffset + 8;
          const infoDataEnd = Math.min(infoDataStart + infoSize, chunkDataEnd);
          const infoData = data.subarray(infoDataStart, infoDataEnd);

          if (infoId === "IART") {
            metadata.artist = decodeWaveInfoText(infoData);
          } else if (infoId === "INAM") {
            metadata.title = decodeWaveInfoText(infoData);
          }

          infoOffset = infoDataStart + infoSize + (infoSize % 2);
        }
      }
    }

    offset = chunkDataStart + chunkSize + (chunkSize % 2);
  }

  return metadata;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  const waveInfoMetadata = extractMetadataFromWaveInfo(data);
  if (waveInfoMetadata?.artist || waveInfoMetadata?.title) {
    return waveInfoMetadata;
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
