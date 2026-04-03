import Encoding from "encoding-japanese";

import { requestFFmpegWorker } from "@web-speed-hackathon-2026/client/src/utils/ffmpeg_worker_client";

interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function extractMetadataFromSound(data: File): Promise<SoundMetadata> {
  try {
    const fileBuffer = await data.arrayBuffer();
    const output = new Uint8Array(
      await requestFFmpegWorker(
        {
          type: "extract-sound-metadata",
          fileBuffer,
        },
        [fileBuffer],
      ),
    );

    const outputUtf8 = Encoding.convert(output, {
      to: "UNICODE",
      from: "AUTO",
      type: "string",
    });

    const meta = parseFFmetadata(outputUtf8);

    return {
      artist: meta.artist ?? UNKNOWN_ARTIST,
      title: meta.title ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  }
}

function parseFFmetadata(ffmetadata: string): Partial<SoundMetadata> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => line.split("="))
      .map(([key, value]) => [key!.trim(), value!.trim()]),
  ) as Partial<SoundMetadata>;
}
