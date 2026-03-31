import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

function extractWavInfoChunk(data: Buffer): SoundMetadata {
  const str = data.toString("binary");
  const infoIdx = str.indexOf("INFO");
  if (infoIdx < 0) return {};

  const result: SoundMetadata = {};
  let pos = infoIdx + 4;
  while (pos < data.length - 8) {
    const tag = data.toString("ascii", pos, pos + 4);
    const size = data.readUInt32LE(pos + 4);
    if (size === 0 || pos + 8 + size > data.length) break;
    if (tag === "INAM" || tag === "IART") {
      const raw = data.subarray(pos + 8, pos + 8 + size);
      const decoded = new TextDecoder("shift_jis").decode(raw).replace(/\0/g, "");
      if (tag === "INAM") result.title = decoded;
      if (tag === "IART") result.artist = decoded;
    }
    pos += 8 + size;
    if (size % 2 !== 0) pos++;
  }
  return result;
}

function isGarbled(str: string | undefined): boolean {
  if (!str) return true;
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x08\x0E-\x1F]/.test(str);
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    const metadata = await MusicMetadata.parseBuffer(data);
    let { artist, title } = metadata.common;

    // music-metadataがShift_JISを正しくデコードできない場合、WAV INFOチャンクから直接読む
    if (isGarbled(title) || isGarbled(artist)) {
      const wavInfo = extractWavInfoChunk(data);
      if (wavInfo.title) title = wavInfo.title;
      if (wavInfo.artist) artist = wavInfo.artist;
    }

    return { artist, title };
  } catch {
    return {
      artist: undefined,
      title: undefined,
    };
  }
}
