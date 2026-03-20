import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const dir = path.resolve(import.meta.dirname, "../../public/movies");
const files = fs.readdirSync(dir).filter((file) => file.endsWith(".gif"));

for (const file of files) {
  const input = path.join(dir, file);
  const output = path.join(dir, file.replace(".gif", ".mp4"));
  console.log(`Converting ${file} ...`);
  execSync(`ffmpeg -i "${input}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -y "${output}"`);
}

console.log("Done!");
