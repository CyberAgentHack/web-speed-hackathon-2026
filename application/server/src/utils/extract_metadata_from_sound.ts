import Encoding from "encoding-japanese";
import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

/**
 * RIFF WAVE の LIST INFO チャンクを直接パースしてエンコーディング自動検出でデコードする。
 * music-metadata は RIFF INFO の高バイトを正しく保持しないため、直接パースが必要。
 */
function parseRiffInfo(data: Buffer): SoundMetadata {
  if (data.length < 12 || data.toString("binary", 0, 4) !== "RIFF") {
    return {};
  }

  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunkId = data.toString("binary", offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);

    if (chunkId === "LIST" && offset + 12 <= data.length) {
      const listType = data.toString("binary", offset + 8, offset + 12);
      if (listType === "INFO") {
        const result: SoundMetadata = {};
        let infoOffset = offset + 12;
        const listEnd = offset + 8 + chunkSize;

        while (infoOffset + 8 <= listEnd && infoOffset + 8 <= data.length) {
          const tagId = data.toString("binary", infoOffset, infoOffset + 4);
          const tagSize = data.readUInt32LE(infoOffset + 4);
          const tagEnd = infoOffset + 8 + tagSize;
          const tagBytes = data.subarray(infoOffset + 8, tagEnd);
          // null terminator を除去
          const trimmed = tagBytes[tagBytes.length - 1] === 0 ? tagBytes.subarray(0, -1) : tagBytes;
          const decoded = Encoding.convert(trimmed, { from: "AUTO", to: "UNICODE", type: "string" }) as string;

          if (tagId === "IART") result.artist = decoded;
          if (tagId === "INAM") result.title = decoded;

          infoOffset += 8 + tagSize + (tagSize % 2); // word-align
        }
        return result;
      }
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return {};
}

/**
 * music-metadata は ID3v2.3 タグを latin1 として読む。
 * 日本語 MP3 は Shift_JIS で書かれていることが多いため、再デコードを試みる。
 * charCode > 0xFF はすでに正しい Unicode なのでそのまま返す。
 */
function fixEncoding(str: string | undefined): string | undefined {
  if (!str) return str;
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 0xff) return str;
  }
  if (!/[^\x00-\x7f]/.test(str)) return str;

  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  const result = Encoding.convert(bytes, { from: "AUTO", to: "UNICODE", type: "string" }) as string;
  return result || str;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  // WAV の場合は RIFF INFO チャンクを直接パース（music-metadata は高バイトを正しく保持しない）
  const riffInfo = parseRiffInfo(data);
  if (riffInfo.artist !== undefined || riffInfo.title !== undefined) {
    return riffInfo;
  }

  // その他のフォーマット（MP3等）は music-metadata を使用
  try {
    const metadata = await MusicMetadata.parseBuffer(data);
    return {
      artist: fixEncoding(metadata.common.artist),
      title: fixEncoding(metadata.common.title),
    };
  } catch {
    return {
      artist: undefined,
      title: undefined,
    };
  }
}
