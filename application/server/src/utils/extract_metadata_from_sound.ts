import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

function findRiffInfoChunk(buf: Buffer, tag: string): Buffer | null {
  for (let i = 0; i < buf.length - 8; i++) {
    if (
      buf[i] === tag.charCodeAt(0) &&
      buf[i + 1] === tag.charCodeAt(1) &&
      buf[i + 2] === tag.charCodeAt(2) &&
      buf[i + 3] === tag.charCodeAt(3)
    ) {
      const size = buf.readUInt32LE(i + 4);
      const data = buf.subarray(i + 8, i + 8 + size);
      const end = data.indexOf(0);
      return data.subarray(0, end === -1 ? size : end);
    }
  }
  return null;
}

function decodeText(raw: Buffer): string {
  const hasHighBytes = raw.some((b) => b >= 0x80);
  if (hasHighBytes) {
    try {
      return new TextDecoder("shift_jis").decode(raw);
    } catch {}
  }
  return raw.toString("utf-8");
}

function extractRiffMetadata(data: Buffer): SoundMetadata | null {
  if (data.length < 12) return null;
  const riff = data.toString("ascii", 0, 4);
  if (riff !== "RIFF") return null;

  const titleBuf = findRiffInfoChunk(data, "INAM");
  const artistBuf = findRiffInfoChunk(data, "IART");
  if (!titleBuf && !artistBuf) return null;

  return {
    title: titleBuf ? decodeText(titleBuf) : undefined,
    artist: artistBuf ? decodeText(artistBuf) : undefined,
  };
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  const riffMeta = extractRiffMetadata(data);
  if (riffMeta && (riffMeta.title || riffMeta.artist)) {
    return riffMeta;
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
