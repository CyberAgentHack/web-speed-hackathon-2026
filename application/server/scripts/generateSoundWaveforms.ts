import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const BIN_COUNT = 100;
const WAVEFORM_FILL_COLOR = "#c2410c";

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx] ?? 0;
}

function toSvg(peaks: number[]): string {
  const reference = Math.max(percentile(peaks, 0.95), 1e-6);
  const rects = peaks
    .map((peak, idx) => {
      const ratio = Math.min(1, peak / reference);
      return `<rect x="${idx}" y="${(1 - ratio).toFixed(6)}" width="1" height="${ratio.toFixed(6)}" fill="${WAVEFORM_FILL_COLOR}" />`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BIN_COUNT} 1" preserveAspectRatio="none">${rects}</svg>`;
}

function chunkPeaks(values: number[], chunkCount: number): number[] {
  const chunkSize = Math.max(1, Math.ceil(values.length / chunkCount));
  const peaks: number[] = [];
  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(values.length, start + chunkSize);
    if (start >= end) {
      peaks.push(0);
      continue;
    }
    let max = 0;
    for (let j = start; j < end; j++) {
      const value = values[j] ?? 0;
      if (value > max) {
        max = value;
      }
    }
    peaks.push(max);
  }
  return peaks;
}

async function decodeMp3ToMonoPcm(mp3Path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      mp3Path,
      "-f",
      "s16le",
      "-ac",
      "1",
      "-ar",
      "44100",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];
    const stderr: Buffer[] = [];

    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk as Buffer));
    ffmpeg.stderr.on("data", (chunk) => stderr.push(chunk as Buffer));

    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg failed: ${Buffer.concat(stderr).toString("utf-8")}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });
}

function generateWaveformSvgFromPcm(pcm: Buffer): string {
  const sampleCount = Math.floor(pcm.length / 2);
  const amplitudes: number[] = new Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const sample = pcm.readInt16LE(i * 2);
    amplitudes[i] = Math.abs(sample) / 32768;
  }
  return toSvg(chunkPeaks(amplitudes, BIN_COUNT));
}

async function main() {
  const root = path.resolve(import.meta.dirname, "../../");
  const soundsDir = path.resolve(root, "public/sounds");
  const waveformsDir = path.resolve(root, "public/sounds/waveforms");

  await fs.mkdir(waveformsDir, { recursive: true });
  const files = await fs.readdir(soundsDir);
  const mp3Files = files.filter((file) => file.endsWith(".mp3"));

  await Promise.all(
    mp3Files.map(async (file) => {
      const id = file.replace(/\.mp3$/, "");
      const inputPath = path.resolve(soundsDir, file);
      const outputPath = path.resolve(waveformsDir, `${id}.svg`);
      const pcm = await decodeMp3ToMonoPcm(inputPath);
      await fs.writeFile(outputPath, generateWaveformSvgFromPcm(pcm), "utf-8");
    }),
  );

  console.log(`Generated ${mp3Files.length} waveform SVG files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
