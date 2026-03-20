import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PUBLIC_PATH = path.resolve(import.meta.dirname, "../../public");

async function convertMovieToWebm(data) {
  const dirPath = await fs.mkdtemp(path.join(tmpdir(), "cax-media-"));

  try {
    const inputPath = path.join(dirPath, "input");
    const outputPath = path.join(dirPath, "output.webm");

    await fs.writeFile(inputPath, data);
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-t",
      "5",
      "-vf",
      "fps=10,crop='min(iw,ih)':'min(iw,ih)'",
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "40",
      "-pix_fmt",
      "yuv420p",
      outputPath,
    ]);

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(dirPath, { force: true, recursive: true });
  }
}

async function main() {
  const moviesDir = path.resolve(PUBLIC_PATH, "movies");
  const filenames = await fs.readdir(moviesDir);
  const gifNames = filenames.filter((filename) => filename.endsWith(".gif"));

  for (const gifName of gifNames) {
    const gifPath = path.resolve(moviesDir, gifName);
    const webmPath = path.resolve(moviesDir, gifName.replace(/\.gif$/u, ".webm"));
    const input = await fs.readFile(gifPath);
    const output = await convertMovieToWebm(input);
    await fs.writeFile(webmPath, output);
    console.log(`converted ${gifName} -> ${path.basename(webmPath)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
