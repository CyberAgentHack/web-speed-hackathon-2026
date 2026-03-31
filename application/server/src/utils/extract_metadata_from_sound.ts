import * as musicMetadata from 'music-metadata';
import iconv from 'iconv-lite';

interface SoundMetadata {
  artist?: string;
  title?: string;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    const metadata = await musicMetadata.parseBuffer(data);

    // music-metadata はテキストを Unicode として扱うが、
    // SHIFT_JIS の場合そのままでは文字化けするため明示的に変換する。
    const decodeIfNeeded = (value?: string | null): string | undefined => {
      if (!value) return undefined;

      // バイト列に戻してから SHIFT_JIS として再デコード
      const sjisBuffer = Buffer.from(value, 'binary');
      return iconv.decode(sjisBuffer, 'shift_jis');
    };

    return {
      artist: decodeIfNeeded(metadata.common.artist),
      title: decodeIfNeeded(metadata.common.title),
    };
  } catch {
    return {
      artist: undefined,
      title: undefined,
    };
  }
}