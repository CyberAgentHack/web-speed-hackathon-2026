import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { v4 as uuidv4 } from "uuid";

const ffmpegPath = ffmpegInstaller.path;

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, { timeout: 60000 }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function convertToMp3(inputBuffer: Buffer, artist: string, title: string): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = uuidv4();
  const inputPath = path.join(tmpDir, `${id}-input`);
  const outputPath = path.join(tmpDir, `${id}-output.mp3`);

  try {
    await fs.writeFile(inputPath, inputBuffer);
    await runFFmpeg([
      "-i", inputPath,
      "-metadata", `artist=${artist}`,
      "-metadata", `title=${title}`,
      "-vn",
      "-y",
      outputPath,
    ]);
    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

export async function convertToGif(inputBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = uuidv4();
  const inputPath = path.join(tmpDir, `${id}-input`);
  const outputPath = path.join(tmpDir, `${id}-output.gif`);

  try {
    await fs.writeFile(inputPath, inputBuffer);
    await runFFmpeg([
      "-i", inputPath,
      "-t", "5",
      "-r", "10",
      "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
      "-an",
      "-y",
      outputPath,
    ]);
    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}
