import { execFile } from "child_process";
import { promisify } from "util";

import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

// soundId → peaks のメモリキャッシュ（サーバー再起動でリセット）
const waveformCache = new Map<string, number[]>();

export async function computeWaveform(inputPath: string, soundId: string): Promise<number[]> {
  const cached = waveformCache.get(soundId);
  if (cached) return cached;

  const { stdout } = await execFileAsync(
    ffmpegPath!,
    ["-i", inputPath, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
    { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 },
  );

  const buf = stdout as unknown as Buffer;
  const samples = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
  const chunkSize = Math.ceil(samples.length / 100);
  const peaks: number[] = [];

  for (let i = 0; i < 100; i++) {
    let sum = 0;
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, samples.length);
    for (let j = start; j < end; j++) {
      sum += Math.abs(samples[j]!) / 32768;
    }
    peaks.push(end > start ? sum / (end - start) : 0);
  }

  waveformCache.set(soundId, peaks);
  return peaks;
}
