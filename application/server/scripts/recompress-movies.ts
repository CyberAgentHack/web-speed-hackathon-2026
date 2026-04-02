import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const dir = path.resolve(import.meta.dirname, "../../public/movies");
const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mp4"));

for (const file of files) {
  const input = path.join(dir, file);
  const tmp = path.join(dir, `tmp_${file}`);
  console.log(`Recompressing ${file} ...`);
  execSync(`ffmpeg -i "${input}" -b:v 300k -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -an -y "${tmp}"`);
  fs.renameSync(tmp, input);
}

console.log("Done!");
