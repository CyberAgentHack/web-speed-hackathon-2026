import { promises as fs } from "node:fs";
import path from "node:path";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractSoundWaveformFromFile } from "@web-speed-hackathon-2026/server/src/utils/extract_sound_waveform";

async function ensureWaveformSidecars(dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name) !== ".m4a") {
      continue;
    }

    const soundPath = path.join(dirPath, entry.name);
    const waveformPath = soundPath.replace(/\.m4a$/u, ".json");

    try {
      await fs.access(waveformPath);
      continue;
    } catch {
      // File does not exist.
    }

    const waveform = await extractSoundWaveformFromFile(soundPath);
    await fs.writeFile(waveformPath, JSON.stringify(waveform));
    console.log(`generated ${path.relative(path.resolve(dirPath, "..", ".."), waveformPath)}`);
  }
}

async function main() {
  await ensureWaveformSidecars(path.resolve(PUBLIC_PATH, "sounds"));
  await ensureWaveformSidecars(path.resolve(UPLOAD_PATH, "sounds"));
}

void main();
