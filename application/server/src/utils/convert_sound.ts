import * as MusicMetadata from "music-metadata";

import { runFFmpeg } from "@web-speed-hackathon-2026/server/src/utils/run_ffmpeg";

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface ConvertSoundResult {
  buffer: Buffer;
  artist: string;
  title: string;
}

export async function convertSound(input: Buffer): Promise<ConvertSoundResult> {
  let artist = UNKNOWN_ARTIST;
  let title = UNKNOWN_TITLE;

  try {
    const metadata = await MusicMetadata.parseBuffer(input);
    artist = metadata.common.artist ?? UNKNOWN_ARTIST;
    title = metadata.common.title ?? UNKNOWN_TITLE;
  } catch {
    // ignore metadata extraction errors
  }

  const buffer = await runFFmpeg(
    input,
    ["-metadata", `artist=${artist}`, "-metadata", `title=${title}`, "-vn"],
    "mp3",
  );

  return { buffer, artist, title };
}
