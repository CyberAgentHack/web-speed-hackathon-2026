import Encoding from "encoding-japanese";
import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

interface SoundMetadata {
  artist: string;
  title: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

function parseFFmetadata(ffmetadata: string): Partial<SoundMetadata> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => line.split("="))
      .map(([key, value]) => [key!.trim(), value!.trim()]),
  ) as Partial<SoundMetadata>;
}

async function extractMetadata(
  ffmpeg: Awaited<ReturnType<typeof loadFFmpeg>>,
  inputFile: string,
  metadataFile: string,
): Promise<SoundMetadata> {
  try {
    await ffmpeg.exec(["-i", inputFile, "-f", "ffmetadata", metadataFile]);
    const output = (await ffmpeg.readFile(metadataFile)) as Uint8Array<ArrayBuffer>;
    const outputUtf8 = Encoding.convert(output, {
      from: "AUTO",
      to: "UNICODE",
      type: "string",
    });
    const metadata = parseFFmetadata(outputUtf8);
    return {
      artist: metadata.artist ?? UNKNOWN_ARTIST,
      title: metadata.title ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  }
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const jobId = crypto.randomUUID();
  const inputFile = `sound-${jobId}.input`;
  const exportFile = `sound-${jobId}.${options.extension}`;
  const metadataFile = `sound-${jobId}.meta.txt`;

  try {
    await ffmpeg.writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

    // 文字化けを防ぐためにメタデータを抽出して付与し直す
    const metadata = await extractMetadata(ffmpeg, inputFile, metadataFile);

    await ffmpeg.exec([
      "-i",
      inputFile,
      "-metadata",
      `artist=${metadata.artist}`,
      "-metadata",
      `title=${metadata.title}`,
      "-vn",
      exportFile,
    ]);

    const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

    return new Blob([output]);
  } finally {
    await Promise.allSettled([
      ffmpeg.deleteFile(inputFile),
      ffmpeg.deleteFile(exportFile),
      ffmpeg.deleteFile(metadataFile),
    ]);
  }
}
