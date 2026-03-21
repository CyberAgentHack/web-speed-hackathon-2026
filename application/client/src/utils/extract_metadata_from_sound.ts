import Encoding from "encoding-japanese";

import { withFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";
let metadataSequence = 0;

export async function extractMetadataFromSound(data: File): Promise<SoundMetadata> {
  const fileKey = `${Date.now()}-${metadataSequence++}`;
  const inputFile = `sound-metadata-input-${fileKey}`;
  const outputFile = `sound-metadata-output-${fileKey}.txt`;

  try {
    const output = await withFFmpeg(async (ffmpeg) => {
      try {
        await ffmpeg.writeFile(inputFile, new Uint8Array(await data.arrayBuffer()));
        await ffmpeg.exec(["-i", inputFile, "-f", "ffmetadata", outputFile]);
        return (await ffmpeg.readFile(outputFile)) as Uint8Array<ArrayBuffer>;
      } finally {
        await Promise.allSettled([ffmpeg.deleteFile(inputFile), ffmpeg.deleteFile(outputFile)]);
      }
    });

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
