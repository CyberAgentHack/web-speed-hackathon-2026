import { execSync } from "node:child_process";
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const PUBLIC_DIR = new URL("../public", import.meta.url).pathname;
const SOUNDS_DIR = join(PUBLIC_DIR, "sounds");
const WAVEFORMS_DIR = join(PUBLIC_DIR, "waveforms");

await mkdir(WAVEFORMS_DIR, { recursive: true });

const files = (await readdir(SOUNDS_DIR)).filter((f) => extname(f) === ".mp3");
const NUM_PEAKS = 100;

for (const file of files) {
  const name = basename(file, ".mp3");
  const inputPath = join(SOUNDS_DIR, file);

  // ffmpeg で raw PCM に変換して波形データを取得
  const pcmBuffer = execSync(`ffmpeg -i "${inputPath}" -ac 1 -ar 8000 -f s16le -v quiet pipe:1`, {
    maxBuffer: 50 * 1024 * 1024,
  });

  // Int16 サンプルに変換
  const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);
  const absValues = Array.from(samples, (v) => Math.abs(v));

  // チャンク分割してピーク値を計算
  const chunkSize = Math.max(1, Math.ceil(absValues.length / NUM_PEAKS));
  const peaks = [];
  for (let i = 0; i < absValues.length; i += chunkSize) {
    const chunk = absValues.slice(i, i + chunkSize);
    peaks.push(chunk.reduce((a, b) => a + b, 0) / chunk.length);
  }

  const max = Math.max(...peaks) || 1;

  await writeFile(join(WAVEFORMS_DIR, `${name}.json`), JSON.stringify({ max, peaks }));
}

console.log(`Generated ${files.length} waveform files`);
