import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

async function withTempFiles(
  inputBuffer: Buffer,
  inputExt: string,
  outputExt: string,
  fn: (inputPath: string, outputPath: string) => Promise<void>,
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wsh-convert-"));
  const inputPath = path.join(tmpDir, `input.${inputExt}`);
  const outputPath = path.join(tmpDir, `output.${outputExt}`);

  try {
    await fs.writeFile(inputPath, inputBuffer);
    await fn(inputPath, outputPath);
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function convertSoundToMp3(inputBuffer: Buffer): Promise<Buffer> {
  if (!ffmpegPath) throw new Error("ffmpeg not found");
  const bin = ffmpegPath;

  return withTempFiles(inputBuffer, "input", "mp3", async (inputPath, outputPath) => {
    await execFileAsync(bin, [
      "-y",
      "-i", inputPath,
      "-codec:a", "libmp3lame",
      "-b:a", "96k",
      "-ar", "44100",
      "-vn",
      outputPath,
    ]);
  });
}

export async function convertMovieToWebm(inputBuffer: Buffer): Promise<Buffer> {
  if (!ffmpegPath) throw new Error("ffmpeg not found");
  const bin = ffmpegPath;

  return withTempFiles(inputBuffer, "input", "webm", async (inputPath, outputPath) => {
    await execFileAsync(bin, [
      "-y",
      "-i", inputPath,
      "-t", "5",
      "-r", "10",
      "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
      "-an",
      "-c:v", "libvpx-vp9",
      "-b:v", "0",
      "-crf", "35",
      "-deadline", "good",
      outputPath,
    ]);
  });
}
