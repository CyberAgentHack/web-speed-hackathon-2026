import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import Encoding from "encoding-japanese";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const execFileAsync = promisify(execFile);

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface SoundMetadata {
  artist: string;
  title: string;
}

async function extractMetadata(inputPath: string): Promise<SoundMetadata> {
  const metaPath = path.join(os.tmpdir(), `${uuidv4()}.txt`);

  try {
    await execFileAsync(ffmpegInstaller.path, [
      "-i", inputPath,
      "-f", "ffmetadata",
      "-y", metaPath,
    ]);

    const raw = await fs.readFile(metaPath);
    const decoded = Encoding.convert(raw, {
      to: "UNICODE",
      from: "AUTO",
      type: "string",
    });

    const meta = parseFFmetadata(decoded);
    return {
      artist: meta.artist ?? UNKNOWN_ARTIST,
      title: meta.title ?? UNKNOWN_TITLE,
    };
  } catch {
    return { artist: UNKNOWN_ARTIST, title: UNKNOWN_TITLE };
  } finally {
    await fs.unlink(metaPath).catch(() => {});
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

export async function convertSound(input: Buffer): Promise<{ data: Buffer; artist: string; title: string }> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${uuidv4()}.wav`);
  const outputPath = path.join(tmpDir, `${uuidv4()}.mp3`);

  try {
    await fs.writeFile(inputPath, input);

    // 元ファイルからメタデータを抽出し、文字コードを変換
    const { artist, title } = await extractMetadata(inputPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-threads", "1",
          "-metadata", `artist=${artist}`,
          "-metadata", `title=${title}`,
          "-vn",
        ])
        .toFormat("mp3")
        .on("error", reject)
        .on("end", () => resolve())
        .save(outputPath);
    });

    const data = await fs.readFile(outputPath);
    return { data, artist, title };
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}
