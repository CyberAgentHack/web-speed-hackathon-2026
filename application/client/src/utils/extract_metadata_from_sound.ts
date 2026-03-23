import Encoding from "encoding-japanese";

import {
  createFFmpegTempFileName,
  loadFFmpeg,
} from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function extractMetadataFromSound(data: File): Promise<SoundMetadata> {
  try {
    const ffmpeg = await loadFFmpeg();
    const inputFile = createFFmpegTempFileName("sound-meta-input");
    const exportFile = createFFmpegTempFileName("sound-meta", "txt");

    await ffmpeg.writeFile(inputFile, new Uint8Array(await data.arrayBuffer()));

    try {
      await ffmpeg.exec(["-i", inputFile, "-f", "ffmetadata", exportFile]);

      const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

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
    } finally {
      await Promise.all([
        ffmpeg.deleteFile(inputFile).catch(() => undefined),
        ffmpeg.deleteFile(exportFile).catch(() => undefined),
      ]);
    }
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
