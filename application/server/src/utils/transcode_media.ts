import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import * as MusicMetadata from "music-metadata";

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface SoundConversionResult {
  artist: string;
  audio: Buffer;
  title: string;
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      ...args,
    ]);
    let stderr = "";

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(stderr.trim() || `ffmpeg exited with code ${String(code)}`),
      );
    });

    ffmpeg.on("error", (error) => {
      reject(error);
    });
  });
}

export async function convertMovieToMp4(data: Buffer): Promise<Buffer> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "cax-movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    await writeFile(inputPath, data);

    await runFfmpeg([
      "-i",
      inputPath,
      "-t",
      "5",
      "-r",
      "10",
      "-vf",
      "crop='min(iw,ih)':'min(iw,ih)',format=yuv420p",
      "-c:v",
      "libx264",
      "-crf",
      "32",
      "-preset",
      "veryslow",
      "-movflags",
      "+faststart",
      "-an",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }
}

export async function convertSoundToMp3(
  data: Buffer,
): Promise<SoundConversionResult> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "cax-sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp3");

  try {
    const metadata = await MusicMetadata.parseBuffer(data).catch(() =>
      undefined
    );
    const artist = metadata?.common.artist ?? UNKNOWN_ARTIST;
    const title = metadata?.common.title ?? UNKNOWN_TITLE;

    await writeFile(inputPath, data);

    await runFfmpeg([
      "-i",
      inputPath,
      "-metadata",
      `artist=${artist}`,
      "-metadata",
      `title=${title}`,
      "-vn",
      outputPath,
    ]);

    return {
      artist,
      audio: await readFile(outputPath),
      title,
    };
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }
}
