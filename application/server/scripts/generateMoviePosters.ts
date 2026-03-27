import { execFile } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const PUBLIC_PATH = path.resolve(import.meta.dirname, "../../public");
const MOVIES_DIR = path.join(PUBLIC_PATH, "movies");

async function generatePoster(videoPath: string, posterPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-vf",
    "scale=320:-1",
    "-q:v",
    "80",
    "-y",
    posterPath,
  ]);
}

async function main(): Promise<void> {
  const files = fs.readdirSync(MOVIES_DIR).filter((f) => f.endsWith(".webm"));

  console.log(`Generating posters for ${files.length} movies...`);

  for (const file of files) {
    const id = path.basename(file, ".webm");
    const mp4Path = path.join(MOVIES_DIR, file);
    const posterPath = path.join(MOVIES_DIR, `${id}-poster.webp`);

    if (fs.existsSync(posterPath)) {
      console.log(`  Skip (exists): ${id}`);
      continue;
    }

    await generatePoster(mp4Path, posterPath);
    console.log(`  Generated: ${id}-poster.webp`);
  }

  console.log("Done: movie posters generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
