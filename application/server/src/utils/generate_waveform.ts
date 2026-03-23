import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const NUM_PEAKS = 100;

export async function generateWaveform(
  mp3Path: string,
  outputDir: string,
): Promise<{ max: number; peaks: number[] }> {
  await fs.mkdir(outputDir, { recursive: true });

  const pcmBuffer = execSync(`ffmpeg -i "${mp3Path}" -ac 1 -ar 8000 -f s16le -v quiet pipe:1`, {
    maxBuffer: 50 * 1024 * 1024,
  });

  const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);
  const absValues = Array.from(samples, (v) => Math.abs(v));

  const chunkSize = Math.max(1, Math.ceil(absValues.length / NUM_PEAKS));
  const peaks: number[] = [];
  for (let i = 0; i < absValues.length; i += chunkSize) {
    const chunk = absValues.slice(i, i + chunkSize);
    peaks.push(chunk.reduce((a, b) => a + b, 0) / chunk.length);
  }

  const max = Math.max(...peaks) || 1;
  const result = { max, peaks };

  const soundId = path.basename(mp3Path, path.extname(mp3Path));
  await fs.writeFile(path.join(outputDir, `${soundId}.json`), JSON.stringify(result));

  return result;
}
