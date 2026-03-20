import { execFile } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export class MediaConversionError extends Error {}

interface SoundMetadata {
  artist: string;
  title: string;
}

async function withTempDir<T>(fn: (dirPath: string) => Promise<T>): Promise<T> {
  const dirPath = await fs.mkdtemp(path.join(tmpdir(), "cax-media-"));

  try {
    return await fn(dirPath);
  } finally {
    await fs.rm(dirPath, { force: true, recursive: true });
  }
}

async function runFfmpeg(args: string[]): Promise<void> {
  try {
    await execFileAsync("ffmpeg", args);
  } catch (cause) {
    throw new MediaConversionError("Failed to convert media", { cause });
  }
}

export async function convertMovieToWebm(data: Buffer): Promise<Buffer> {
  return withTempDir(async (dirPath) => {
    const inputPath = path.join(dirPath, "input");
    const outputPath = path.join(dirPath, "output.webm");

    await fs.writeFile(inputPath, data);

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-t",
      "5",
      "-vf",
      "fps=10,crop='min(iw,ih)':'min(iw,ih)',scale='min(iw,500)':-2",
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "48",
      "-deadline",
      "good",
      "-cpu-used",
      "4",
      "-pix_fmt",
      "yuv420p",
      outputPath,
    ]);

    return fs.readFile(outputPath);
  });
}

export async function convertSoundToMp3(
  data: Buffer,
  metadata: SoundMetadata,
): Promise<Buffer> {
  return withTempDir(async (dirPath) => {
    const inputPath = path.join(dirPath, "input");
    const outputPath = path.join(dirPath, "output.mp3");

    await fs.writeFile(inputPath, data);

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-metadata",
      `artist=${metadata.artist}`,
      "-metadata",
      `title=${metadata.title}`,
      "-vn",
      outputPath,
    ]);

    return fs.readFile(outputPath);
  });
}
