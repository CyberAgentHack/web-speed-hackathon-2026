import type { FFmpeg } from "@ffmpeg/ffmpeg";
import Encoding from "encoding-japanese";

interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function extractMetadataFromSound(
  data: File,
  existingFfmpeg?: FFmpeg,
): Promise<SoundMetadata> {
  let ownFfmpeg = false;
  let ffmpeg: FFmpeg | undefined;

  try {
    if (existingFfmpeg != null) {
      ffmpeg = existingFfmpeg;
    } else {
      const { loadFFmpeg } = await import("@web-speed-hackathon-2026/client/src/utils/load_ffmpeg");
      ffmpeg = await loadFFmpeg();
      ownFfmpeg = true;
    }

    const exportFile = "meta.txt";

    await ffmpeg.writeFile("file", new Uint8Array(await data.arrayBuffer()));

    await ffmpeg.exec(["-i", "file", "-f", "ffmetadata", exportFile]);

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
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  } finally {
    if (ownFfmpeg && ffmpeg != null) {
      try {
        ffmpeg.terminate();
      } catch {
        /* ignore */
      }
    }
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
