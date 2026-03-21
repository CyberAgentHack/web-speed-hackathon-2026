import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT_DIR = process.cwd();
const MOVIES_DIR = path.resolve(ROOT_DIR, "public/movies");

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: "inherit",
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.resolve(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function main() {
  const files = await walk(MOVIES_DIR);
  const gifFiles = files.filter((filePath) => path.extname(filePath).toLowerCase() === ".gif");

  if (gifFiles.length === 0) {
    console.log("No GIF files found.");
    return;
  }

  for (const gifPath of gifFiles) {
    const dir = path.dirname(gifPath);
    const baseName = path.basename(gifPath, ".gif");
    const mp4Path = path.resolve(dir, `${baseName}.mp4`);

    console.log(`Converting: ${path.relative(ROOT_DIR, gifPath)} -> ${path.relative(ROOT_DIR, mp4Path)}`);

    await runFfmpeg([
      "-y",
      "-i",
      gifPath,
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=10",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "24",
      mp4Path,
    ]);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});