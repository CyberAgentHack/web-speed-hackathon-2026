import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import sharp from "sharp";

const dir = path.resolve(import.meta.dirname, "../../public/movies");
const postersDir = path.join(dir, "posters");
fs.mkdirSync(postersDir, { recursive: true });

const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mp4"));

for (const file of files) {
  const id = path.basename(file, ".mp4");
  const input = path.join(dir, file);
  const output = path.join(postersDir, `${id}.webp`);

  if (fs.existsSync(output)) {
    console.log(`Skipping ${id} (already exists)`);
    continue;
  }

  console.log(`Generating poster for ${id} ...`);

  // ffmpegで最初のフレームをPNGとしてstdoutに出力し、sharpでWebPに変換
  const pngBuffer = execSync(
    `ffmpeg -i "${input}" -vframes 1 -f image2pipe -c:v png -`,
    { stdio: ["pipe", "pipe", "pipe"], maxBuffer: 50 * 1024 * 1024 },
  );

  await sharp(pngBuffer).webp({ quality: 80 }).toFile(output);
  console.log(`  -> ${output}`);
}

console.log("Done!");
