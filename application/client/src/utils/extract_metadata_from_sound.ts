interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function extractMetadataFromSound(_data: File): Promise<SoundMetadata> {
  // パフォーマンス向上のため、バイナリ解析（encoding-japanese / ffmpeg）を停止
  return {
    artist: UNKNOWN_ARTIST,
    title: UNKNOWN_TITLE,
  };
}
