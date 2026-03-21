import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

const SHIFT_JIS_DECODER = new TextDecoder("shift_jis");
const CONTROL_OR_LATIN1_EXTENDED_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;
const JAPANESE_CHARACTER_PATTERN = /[ぁ-んァ-ヶ一-龠々ー]/g;

function scoreDecodedText(text: string): number {
  const japaneseMatches = text.match(JAPANESE_CHARACTER_PATTERN)?.length ?? 0;
  const controlMatches = text.match(/[\u0000-\u001f\u007f-\u009f]/g)?.length ?? 0;
  const replacementMatches = text.match(/\uFFFD/g)?.length ?? 0;
  return japaneseMatches * 4 - controlMatches * 8 - replacementMatches * 6 + text.length;
}

function normalizeMetadataText(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }

  if (!CONTROL_OR_LATIN1_EXTENDED_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const bytes = Uint8Array.from(trimmed, (char) => char.charCodeAt(0) & 0xff);
  const highBitRestoredBytes = Uint8Array.from(bytes, (byte) => byte | 0x80);

  const decodedCandidates = [
    SHIFT_JIS_DECODER.decode(bytes).replace(/\u0000/g, "").trim(),
    SHIFT_JIS_DECODER.decode(highBitRestoredBytes).replace(/\u0000/g, "").trim(),
  ].filter((candidate) => candidate !== "");

  if (decodedCandidates.length === 0) {
    return trimmed;
  }

  decodedCandidates.sort((left, right) => scoreDecodedText(right) - scoreDecodedText(left));
  return decodedCandidates[0] ?? trimmed;
}

function decodeShiftJISText(value: Buffer): string | undefined {
  const nullByteIndex = value.indexOf(0);
  const raw = nullByteIndex === -1 ? value : value.subarray(0, nullByteIndex);
  if (raw.length === 0) {
    return undefined;
  }

  const decoded = SHIFT_JIS_DECODER.decode(raw).trim();
  return decoded !== "" ? decoded : undefined;
}

function extractMetadataFromWaveInfoChunk(data: Buffer): SoundMetadata | undefined {
  if (data.length < 12) {
    return undefined;
  }
  if (data.toString("ascii", 0, 4) !== "RIFF" || data.toString("ascii", 8, 12) !== "WAVE") {
    return undefined;
  }

  const readInfoTag = (tagId: string): string | undefined => {
    const index = data.indexOf(Buffer.from(tagId, "ascii"));
    if (index === -1 || index + 8 > data.length) {
      return undefined;
    }
    const chunkSize = data.readUInt32LE(index + 4);
    const chunkDataStart = index + 8;
    const chunkDataEnd = Math.min(chunkDataStart + chunkSize, data.length);
    if (chunkDataEnd <= chunkDataStart) {
      return undefined;
    }
    return decodeShiftJISText(data.subarray(chunkDataStart, chunkDataEnd));
  };

  const artist = readInfoTag("IART");
  const title = readInfoTag("INAM");

  if (artist === undefined && title === undefined) {
    return undefined;
  }
  return { artist, title };
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    const waveInfoMetadata = extractMetadataFromWaveInfoChunk(data);
    if (waveInfoMetadata !== undefined) {
      return waveInfoMetadata;
    }

    const metadata = await MusicMetadata.parseBuffer(data);
    return {
      artist: normalizeMetadataText(metadata.common.artist),
      title: normalizeMetadataText(metadata.common.title),
    };
  } catch {
    return {
      artist: undefined,
      title: undefined,
    };
  }
}
