import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

const sjisDecoder = new TextDecoder("shift_jis");

/**
 * WAV (RIFF) ファイルの LIST/INFO チャンクから INAM, IART を Shift_JIS デコードで取得する。
 * music-metadata は RIFF INFO の Shift_JIS を正しくデコードできないため手動パースする。
 */
function extractRiffInfo(buf: Buffer): SoundMetadata {
  // RIFF ヘッダー確認
  if (buf.length < 12 || buf.subarray(0, 4).toString("ascii") !== "RIFF") {
    return {};
  }
  const result: SoundMetadata = {};
  let pos = 12; // skip "RIFF" + size + "WAVE"
  while (pos < buf.length - 8) {
    const id = buf.subarray(pos, pos + 4).toString("ascii");
    const size = buf.readUInt32LE(pos + 4);
    if (id === "LIST") {
      const listType = buf.subarray(pos + 8, pos + 12).toString("ascii");
      if (listType === "INFO") {
        let ipos = pos + 12;
        while (ipos < pos + 8 + size) {
          const tagId = buf.subarray(ipos, ipos + 4).toString("ascii");
          const tagSize = buf.readUInt32LE(ipos + 4);
          const tagData = buf.subarray(ipos + 8, ipos + 8 + tagSize);
          // null 終端を除去して Shift_JIS デコード
          const trimmed = tagData[tagData.length - 1] === 0 ? tagData.subarray(0, -1) : tagData;
          const text = sjisDecoder.decode(trimmed);
          if (tagId === "INAM") result.title = text;
          if (tagId === "IART") result.artist = text;
          ipos += 8 + tagSize + (tagSize % 2 ? 1 : 0);
        }
      }
    }
    pos += 8 + size + (size % 2 ? 1 : 0);
  }
  return result;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  // WAV の場合は RIFF INFO チャンクから直接 Shift_JIS デコード
  const riffInfo = extractRiffInfo(data);
  if (riffInfo.title || riffInfo.artist) {
    return riffInfo;
  }

  // WAV 以外（MP3 等）は music-metadata にフォールバック
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
