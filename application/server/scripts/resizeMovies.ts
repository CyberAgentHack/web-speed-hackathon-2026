import fs from "fs/promises";
import path from "path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

const TARGET_SIZE = 512;
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

async function resizeGif(filePath: string) {
  const temporaryPath = `${filePath}.tmp.gif`;

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    filePath,
    "-filter_complex",
    `fps=10,scale=${TARGET_SIZE}:${TARGET_SIZE}:flags=lanczos,split[v1][v2];[v1]palettegen=stats_mode=diff[p];[v2][p]paletteuse=dither=bayer:bayer_scale=5`,
    temporaryPath,
  ]);

  await fs.rename(temporaryPath, filePath);
}

async function main() {
  const movieFiles = (
    await Promise.all(MOVIE_DIRECTORIES.map((directoryPath) => listGifFiles(directoryPath)))
  ).flat();

  for (const movieFile of movieFiles) {
    await resizeGif(movieFile);
  }
}

await main();
