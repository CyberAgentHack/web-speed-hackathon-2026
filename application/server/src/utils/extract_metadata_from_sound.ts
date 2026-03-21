import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
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
