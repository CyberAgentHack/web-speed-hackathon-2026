import fs from "fs/promises";
import path from "path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

const MOVIE_DIRECTORIES = [path.join(PUBLIC_PATH, "movies"), path.join(UPLOAD_PATH, "movies")];

async function listGifFiles(directoryPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".gif")
      .map((entry) => path.join(directoryPath, entry.name));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function convertGifToWebm(filePath: string) {
  const targetPath = filePath.replace(/\.gif$/i, ".webm");

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    filePath,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "36",
    "-an",
    targetPath,
  ]);
}

async function main() {
  const movieFiles = (
    await Promise.all(MOVIE_DIRECTORIES.map((directoryPath) => listGifFiles(directoryPath)))
  ).flat();

  for (const movieFile of movieFiles) {
    await convertGifToWebm(movieFile);
  }
}

await main();
