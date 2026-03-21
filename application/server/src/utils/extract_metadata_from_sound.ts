import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    console.log("[extractMetadataFromSound] Input buffer size:", data.length);
    const metadata = await MusicMetadata.parseBuffer(data);
    console.log("[extractMetadataFromSound] Extracted metadata:", {
      artist: metadata.common.artist,
      title: metadata.common.title,
      all_common_keys: Object.keys(metadata.common),
    });
    return {
      artist: metadata.common.artist,
      title: metadata.common.title,
    };
  } catch (error) {
    console.error("[extractMetadataFromSound] Error parsing metadata:", error);
    return {
      artist: undefined,
      title: undefined,
    };
  }
}
