import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const TARGET_PEAK_COUNT = 100;
const TARGET_SAMPLE_RATE = 2_000;
const MAX_STDOUT_BYTES = 16 * 1024 * 1024;

export interface SoundWaveform {
  max: number;
  peaks: number[];
}

async function withTempDir<T>(callback: (dirPath: string) => Promise<T>): Promise<T> {
  const dirPath = await fs.mkdtemp(path.join(os.tmpdir(), "cax-waveform-"));
  try {
    return await callback(dirPath);
  } finally {
    await fs.rm(dirPath, { force: true, recursive: true });
  }
}

async function decodeMonoPcm(inputPath: string): Promise<Buffer> {
  const { stdout } = await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      String(TARGET_SAMPLE_RATE),
      "-f",
      "f32le",
      "-acodec",
      "pcm_f32le",
      "pipe:1",
    ],
    {
      encoding: "buffer",
      maxBuffer: MAX_STDOUT_BYTES,
    },
  );

  return stdout;
}

function calculateWaveform(decoded: Buffer): SoundWaveform {
  const sampleCount = Math.floor(decoded.length / 4);
  if (sampleCount === 0) {
    return {
      max: 0,
      peaks: Array(TARGET_PEAK_COUNT).fill(0),
    };
  }

  const peaks = Array.from({ length: TARGET_PEAK_COUNT }, (_, bucketIndex) => {
    const start = Math.floor((bucketIndex * sampleCount) / TARGET_PEAK_COUNT);
    const end = Math.max(start + 1, Math.floor(((bucketIndex + 1) * sampleCount) / TARGET_PEAK_COUNT));
    let bucketPeak = 0;

    for (let sampleIndex = start; sampleIndex < end && sampleIndex < sampleCount; sampleIndex += 1) {
      const sample = Math.abs(decoded.readFloatLE(sampleIndex * 4));
      if (sample > bucketPeak) {
        bucketPeak = sample;
      }
    }

    return bucketPeak;
  });

  return {
    max: peaks.length > 0 ? Math.max(...peaks) : 0,
    peaks,
  };
}

export async function extractSoundWaveformFromFile(filePath: string): Promise<SoundWaveform> {
  const decoded = await decodeMonoPcm(filePath);
  return calculateWaveform(decoded);
}

export async function extractSoundWaveform(
  data: Buffer,
  inputExtension: string,
): Promise<SoundWaveform> {
  return withTempDir(async (dirPath) => {
    const inputPath = path.join(dirPath, `input.${inputExtension}`);
    await fs.writeFile(inputPath, data);
    return extractSoundWaveformFromFile(inputPath);
  });
}
