import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

function extractWavInfoChunk(data: Buffer): SoundMetadata | null {
  const str = data.toString("latin1");
  const listIdx = str.indexOf("LIST");
  if (listIdx < 0) return null;

  const infoIdx = str.indexOf("INFO", listIdx);
  if (infoIdx < 0) return null;

  // Parse LIST chunk (search within a reasonable range)
  const chunkEnd = Math.min(listIdx + 1024, data.length);
  const chunk = data.subarray(listIdx, chunkEnd);
  const chunkStr = chunk.toString("latin1");

  const decoder = new TextDecoder("shift_jis");
  let title: string | undefined;
  let artist: string | undefined;

  const inamIdx = chunkStr.indexOf("INAM");
  if (inamIdx >= 0 && inamIdx + 8 < chunk.length) {
    const len = chunk.readUInt32LE(inamIdx + 4);
    if (len > 0 && inamIdx + 8 + len <= chunk.length) {
      title = decoder.decode(chunk.subarray(inamIdx + 8, inamIdx + 8 + len)).replace(/\0/g, "").trim();
    }
  }

  const iartIdx = chunkStr.indexOf("IART");
  if (iartIdx >= 0 && iartIdx + 8 < chunk.length) {
    const len = chunk.readUInt32LE(iartIdx + 4);
    if (len > 0 && iartIdx + 8 + len <= chunk.length) {
      artist = decoder.decode(chunk.subarray(iartIdx + 8, iartIdx + 8 + len)).replace(/\0/g, "").trim();
    }
  }

  if (title || artist) return { title, artist };
  return null;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  // Try WAV LIST/INFO chunk first (handles Shift-JIS encoding)
  const wavInfo = extractWavInfoChunk(data);
  if (wavInfo && (wavInfo.title || wavInfo.artist)) {
    return wavInfo;
  }

  // Fall back to music-metadata for MP3/other formats
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
