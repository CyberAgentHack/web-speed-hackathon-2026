import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function withTempDir<T>(callback: (dirPath: string) => Promise<T>): Promise<T> {
  const dirPath = await fs.mkdtemp(path.join(os.tmpdir(), "cax-media-"));
  try {
    return await callback(dirPath);
  } finally {
    await fs.rm(dirPath, { recursive: true, force: true });
  }
}

async function runCommand(command: string, args: string[]): Promise<void> {
  await execFileAsync(command, args);
}

async function runCommandWithStdout(command: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(command, args);
  return stdout;
}

export async function extractImageDescription(
  data: Buffer,
  inputExtension: string,
): Promise<string> {
  return withTempDir(async (dirPath) => {
    const inputPath = path.join(dirPath, `input.${inputExtension}`);

    await fs.writeFile(inputPath, data);

    const description = await runCommandWithStdout("magick", [
      "identify",
      "-format",
      "%c",
      inputPath,
    ]);

    return description.trim();
  });
}

export async function convertImageToWebp(data: Buffer, inputExtension: string): Promise<Buffer> {
  return withTempDir(async (dirPath) => {
    const inputPath = path.join(dirPath, `input.${inputExtension}`);
    const outputPath = path.join(dirPath, "output.webp");

    await fs.writeFile(inputPath, data);
    await runCommand("magick", [inputPath, "-auto-orient", "-strip", "-quality", "82", outputPath]);

    return fs.readFile(outputPath);
  });
}

export async function convertMovieToMp4(data: Buffer, inputExtension: string): Promise<Buffer> {
  return withTempDir(async (dirPath) => {
    const inputPath = path.join(dirPath, `input.${inputExtension}`);
    const outputPath = path.join(dirPath, "output.mp4");

    await fs.writeFile(inputPath, data);
    await runCommand("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-t",
      "5",
      "-an",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "crop='min(iw,ih)':'min(iw,ih)',fps=10,scale=480:480:flags=lanczos",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "30",
      outputPath,
    ]);

    return fs.readFile(outputPath);
  });
}

interface SoundMetadata {
  artist?: string;
  title?: string;
}

export async function convertSoundToM4a(
  data: Buffer,
  inputExtension: string,
  metadata: SoundMetadata,
): Promise<Buffer> {
  return withTempDir(async (dirPath) => {
    const inputPath = path.join(dirPath, `input.${inputExtension}`);
    const outputPath = path.join(dirPath, "output.m4a");

    await fs.writeFile(inputPath, data);

    const args = [
      "-y",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-vn",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
    ];

    if (metadata.artist) {
      args.push("-metadata", `artist=${metadata.artist}`);
    }
    if (metadata.title) {
      args.push("-metadata", `title=${metadata.title}`);
    }

    args.push(outputPath);
    await runCommand("ffmpeg", args);

    return fs.readFile(outputPath);
  });
}
