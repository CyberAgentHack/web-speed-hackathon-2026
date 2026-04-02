import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const dir = path.resolve(import.meta.dirname, "../../public/sounds");
const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mp3"));

for (const file of files) {
  const input = path.join(dir, file);
  const tmp = path.join(dir, `tmp_${file}`);
  console.log(`Recompressing ${file} ...`);
  execSync(`ffmpeg -i "${input}" -b:a 128k -y "${tmp}"`);
  fs.renameSync(tmp, input);
}

console.log("Done!");
