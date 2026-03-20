import { parseBuffer } from "music-metadata";

interface SoundMetadata {
  artist: string;
  title: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function extractMetadataFromSound(data: File): Promise<SoundMetadata> {
  try {
    const metadata = await parseBuffer(new Uint8Array(await data.arrayBuffer()));
    return {
      artist: metadata.common.artist ?? UNKNOWN_ARTIST,
      title: metadata.common.title ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  }
}
