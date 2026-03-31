import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);
const waveformCache = new Map<string, number[]>();

// MP3等の圧縮音声をffmpegでf32le（32bit float）モノラルPCMにデコードする。
// 波形計算にのみ使うため低サンプルレート(8000Hz)で高速化する。
async function decodeToPcmF32(data: Buffer): Promise<Float32Array> {
  const dirPath = await fs.mkdtemp(path.join(tmpdir(), "cax-wave-"));
  try {
    const inputPath = path.join(dirPath, "input");
    const outputPath = path.join(dirPath, "output.raw");
    await fs.writeFile(inputPath, data);
    await execFileAsync("ffmpeg", [
      "-y", "-i", inputPath,
      "-f", "f32le",
      "-ac", "1",
      "-ar", "8000",
      outputPath,
    ]);
    const raw = await fs.readFile(outputPath);
    return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  } finally {
    await fs.rm(dirPath, { force: true, recursive: true });
  }
}

function calculateWaveform(samples: Float32Array): number[] {
  const bucketCount = 100;
  if (samples.length === 0) return [];

  const chunkSize = Math.max(1, Math.floor(samples.length / bucketCount));
  const peaks: number[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const start = i * chunkSize;
    if (start >= samples.length) break;
    const end = Math.min(samples.length, start + chunkSize);

    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += Math.abs(samples[j]!);
    }
    peaks.push(sum / (end - start));
  }

  return peaks;
}

export async function createSoundWaveform(data: Buffer): Promise<number[]> {
  const samples = await decodeToPcmF32(data);
  return calculateWaveform(samples);
}

async function resolveSoundFilePath(soundId: string): Promise<string> {
  const candidates = [
    path.resolve(UPLOAD_PATH, `./sounds/${soundId}.mp3`),
    path.resolve(PUBLIC_PATH, `./sounds/${soundId}.mp3`),
  ];

  for (const filePath of candidates) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      continue;
    }
  }

  throw new Error(`Sound file not found: ${soundId}`);
}

export async function getSoundWaveform(soundId: string): Promise<number[]> {
  const cached = waveformCache.get(soundId);
  if (cached != null) {
    return cached;
  }

  const filePath = await resolveSoundFilePath(soundId);
  const data = await fs.readFile(filePath);
  const samples = await decodeToPcmF32(data);
  const waveform = calculateWaveform(samples);
  waveformCache.set(soundId, waveform);
  return waveform;
}
