import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);

const SOUNDS_DIR = new URL("../public/sounds", import.meta.url).pathname;
const PEAK_COUNT = 100;

async function extractPeaks(filePath) {
  // Use ffmpeg to convert mp3 to raw PCM (mono, f32le, 22050Hz for speed)
  const { stdout } = await execFileAsync(
    "ffmpeg",
    ["-i", filePath, "-f", "f32le", "-ac", "1", "-ar", "22050", "-"],
    { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 },
  );

  const samples = new Float32Array(stdout.buffer, stdout.byteOffset, stdout.byteLength / 4);
  const len = samples.length;
  const chunkSize = Math.ceil(len / PEAK_COUNT);
  const peaks = [];

  for (let i = 0; i < len; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, len);
    for (let j = i; j < end; j++) {
      sum += Math.abs(samples[j]);
    }
    peaks.push(sum / (end - i));
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

  return { max, peaks };
}

const files = (await readdir(SOUNDS_DIR)).filter((f) => f.endsWith(".mp3"));
console.log(`Generating peaks for ${files.length} sound files...`);

for (const file of files) {
  const id = file.replace(".mp3", "");
  const filePath = join(SOUNDS_DIR, file);
  const data = await extractPeaks(filePath);
  const outPath = join(SOUNDS_DIR, `${id}.peaks.json`);
  await writeFile(outPath, JSON.stringify(data));
  console.log(`  ${id} -> ${data.peaks.length} peaks`);
}

console.log("Done.");
