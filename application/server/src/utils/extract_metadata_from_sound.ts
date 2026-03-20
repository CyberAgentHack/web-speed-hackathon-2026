import fs from "fs/promises";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import Encoding from "encoding-japanese";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);


interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "meta-"));
    const inputPath = path.join(tmpDir, "input");
    const outputPath = path.join(tmpDir, "meta.txt");

    await fs.writeFile(inputPath, data);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions("-f", "ffmetadata")
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    const output = await fs.readFile(outputPath);

    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

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
