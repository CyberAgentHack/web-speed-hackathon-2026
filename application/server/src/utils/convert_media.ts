import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { v4 as uuidv4 } from "uuid";

const execFileAsync = promisify(execFile);

export async function convertMovieToWebm(inputBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = uuidv4();
  const inputPath = path.join(tmpDir, `${id}-input`);
  const outputPath = path.join(tmpDir, `${id}-output.webm`);

  try {
    await fs.writeFile(inputPath, inputBuffer);

    await execFileAsync("ffmpeg", [
      "-i",
      inputPath,
      "-t",
      "5",
      "-r",
      "10",
      "-vf",
      "crop='min(iw,ih)':'min(iw,ih)'",
      "-pix_fmt",
      "yuv420p",
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "50",
      "-b:v",
      "0",
      "-an",
      outputPath,
    ]);

    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

export async function extractPosterFromVideo(inputBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = uuidv4();
  const inputPath = path.join(tmpDir, `${id}-poster-input`);
  const outputPath = path.join(tmpDir, `${id}-poster.webp`);

  try {
    await fs.writeFile(inputPath, inputBuffer);

    await execFileAsync("ffmpeg", [
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=320:-1",
      "-q:v",
      "80",
      outputPath,
    ]);

    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

interface SoundMetadata {
  artist?: string;
  title?: string;
}

export async function convertSoundToMp3(inputBuffer: Buffer, metadata: SoundMetadata): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = uuidv4();
  const inputPath = path.join(tmpDir, `${id}-input`);
  const outputPath = path.join(tmpDir, `${id}-output.mp3`);

  try {
    await fs.writeFile(inputPath, inputBuffer);

    const args = ["-i", inputPath];

    if (metadata.artist) {
      args.push("-metadata", `artist=${metadata.artist}`);
    }
    if (metadata.title) {
      args.push("-metadata", `title=${metadata.title}`);
    }

    args.push("-vn", outputPath);

    await execFileAsync("ffmpeg", args);

    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}
