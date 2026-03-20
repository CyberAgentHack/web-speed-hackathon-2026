import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_BAR_COUNT = 100;

async function runFfmpegToBuffer(args: string[]): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      ...args,
    ]);

    const stdoutChunks: Buffer[] = [];
    let stderr = "";

    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
        return;
      }

      reject(
        new Error(stderr.trim() || `ffmpeg exited with code ${String(code)}`),
      );
    });

    ffmpeg.on("error", (error) => {
      reject(error);
    });
  });
}

export async function extractWaveformPeaksFromFile(
  inputFilePath: string,
  barCount: number = DEFAULT_BAR_COUNT,
): Promise<number[]> {
  if (barCount <= 0) {
    return [];
  }

  const pcm = await runFfmpegToBuffer([
    "-i",
    inputFilePath,
    "-ac",
    "1",
    "-f",
    "f32le",
    "-acodec",
    "pcm_f32le",
    "-",
  ]);

  const sampleCount = Math.floor(pcm.length / 4);
  if (sampleCount === 0) {
    return [];
  }

  const chunkSize = Math.ceil(sampleCount / barCount);
  const peaks: number[] = [];

  for (let start = 0; start < sampleCount; start += chunkSize) {
    const end = Math.min(start + chunkSize, sampleCount);
    let sum = 0;

    for (let i = start; i < end; i++) {
      sum += Math.abs(pcm.readFloatLE(i * 4));
    }

    peaks.push(sum / (end - start));
  }

  const max = peaks.length > 0 ? Math.max(...peaks) : 0;
  if (max <= 0) {
    return peaks.map(() => 0);
  }

  return peaks.map((peak) => peak / max);
}

export async function extractWaveformPeaksFromBuffer(
  data: Buffer,
  barCount: number = DEFAULT_BAR_COUNT,
): Promise<number[]> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "cax-waveform-"));
  const inputPath = path.join(tmpDir, "input.mp3");

  try {
    await writeFile(inputPath, data);
    return await extractWaveformPeaksFromFile(inputPath, barCount);
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }
}

export function buildWaveformSvg(peaks: number[]): string {
  const bars = peaks.map((peak, idx) => {
    const ratio = Number.isFinite(peak) && peak > 0 ? Math.min(peak, 1) : 0;
    return `<rect fill="oklch(55.3% 0.195 38.402)" height="${ratio}" width="1" x="${idx}" y="${
      1 - ratio
    }"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 1">${bars}</svg>`;
}

export async function writeWaveformSvgFile(
  inputFilePath: string,
  outputFilePath: string,
  barCount: number = DEFAULT_BAR_COUNT,
): Promise<number[]> {
  const peaks = await extractWaveformPeaksFromFile(inputFilePath, barCount);
  const svg = buildWaveformSvg(peaks);
  await mkdir(path.dirname(outputFilePath), { recursive: true });
  await writeFile(outputFilePath, svg);
  return peaks;
}
