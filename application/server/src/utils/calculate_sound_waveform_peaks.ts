import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export const NUM_SOUND_WAVEFORM_PEAKS = 100;
const FFMPEG_STDOUT_MAX_BUFFER_BYTES = 128 * 1024 * 1024;

async function withTempInputFile(
  inputBuffer: Buffer,
  fn: (inputPath: string) => Promise<Buffer>,
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wsh-waveform-"));
  const inputPath = path.join(tmpDir, "input.bin");

  try {
    await fs.writeFile(inputPath, inputBuffer);
    return await fn(inputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function calculateSoundWaveformPeaks(inputBuffer: Buffer): Promise<number[]> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg not found");
  }
  const ffmpegBin = ffmpegPath;

  const stdout = await withTempInputFile(inputBuffer, async (inputPath) => {
    const { stdout } = await execFileAsync(
      ffmpegBin,
      [
        "-v",
        "error",
        "-i",
        inputPath,
        "-f",
        "f32le",
        "-acodec",
        "pcm_f32le",
        // 波形表示用なので、軽量な mono / low-rate PCM に落として十分
        "-ac",
        "1",
        "-ar",
        "4000",
        "-",
      ],
      {
        encoding: "buffer",
        maxBuffer: FFMPEG_STDOUT_MAX_BUFFER_BYTES,
      },
    );
    return stdout;
  });

  if (stdout.byteLength === 0) {
    return new Array(NUM_SOUND_WAVEFORM_PEAKS).fill(0);
  }

  const samples = new Float32Array(stdout.buffer, stdout.byteOffset, Math.floor(stdout.byteLength / 4));
  const sampleCount = samples.length;
  const chunkSize = Math.max(1, Math.ceil(sampleCount / NUM_SOUND_WAVEFORM_PEAKS));
  const peaks = new Array<number>(NUM_SOUND_WAVEFORM_PEAKS).fill(0);
  let maxPeak = 0;

  for (let i = 0; i < NUM_SOUND_WAVEFORM_PEAKS; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, sampleCount);
    if (start >= end) {
      continue;
    }

    let sum = 0;
    for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
      sum += Math.abs(samples[sampleIndex] ?? 0);
    }

    const average = sum / (end - start);
    peaks[i] = average;
    if (average > maxPeak) {
      maxPeak = average;
    }
  }

  if (maxPeak === 0) {
    return peaks;
  }

  return peaks.map((peak) => Number((peak / maxPeak).toFixed(6)));
}
