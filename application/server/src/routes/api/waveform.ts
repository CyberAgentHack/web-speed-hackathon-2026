import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";

import { Sound } from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const waveformRouter = Router();

// Cache waveform results in memory
const waveformCache = new Map<string, { max: number; peaks: number[] }>();

async function findSoundFile(soundId: string, extension: string): Promise<Buffer> {
  const paths = [
    path.resolve(UPLOAD_PATH, `sounds/${soundId}.${extension}`),
    path.resolve(PUBLIC_PATH, `sounds/${soundId}.${extension}`),
  ];
  for (const p of paths) {
    try {
      return await fs.readFile(p);
    } catch {
      // try next
    }
  }
  throw new Error("Sound file not found");
}

function calculateWaveform(pcmData: Float32Array, channels: number, channelData: Float32Array[]): { max: number; peaks: number[] } {
  const length = channelData[0]!.length;
  const normalized = new Float64Array(length);

  if (channels === 1) {
    const ch = channelData[0]!;
    for (let i = 0; i < length; i++) {
      normalized[i] = Math.abs(ch[i]!);
    }
  } else {
    const left = channelData[0]!;
    const right = channelData[1]!;
    for (let i = 0; i < length; i++) {
      normalized[i] = (Math.abs(left[i]!) + Math.abs(right[i]!)) / 2;
    }
  }

  const chunkSize = Math.ceil(length / 100);
  const peaks: number[] = [];
  for (let i = 0; i < length; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, length);
    for (let j = i; j < end; j++) {
      sum += normalized[j]!;
    }
    peaks.push(sum / (end - i));
  }
  const max = Math.max(...peaks, 0);
  return { max, peaks };
}

waveformRouter.get("/waveform/:soundId", async (req, res) => {
  const { soundId } = req.params;

  // Check cache
  const cached = waveformCache.get(soundId);
  if (cached) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.json(cached);
  }

  // Find sound in DB to get extension
  const sound = await Sound.findByPk(soundId);
  if (!sound) {
    throw new httpErrors.NotFound();
  }

  try {
    const buffer = await findSoundFile(soundId, sound.extension);

    // Use ffmpeg to decode to raw PCM via a child process
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const os = await import("node:os");
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wsh-waveform-"));
    const inputPath = path.join(tmpDir, `input.${sound.extension}`);
    const outputPath = path.join(tmpDir, "output.raw");

    try {
      await fs.writeFile(inputPath, buffer);

      // Decode to raw PCM f32le, stereo, 22050Hz (lower sample rate for speed)
      await execFileAsync("ffmpeg", [
        "-y", "-i", inputPath,
        "-f", "f32le", "-acodec", "pcm_f32le",
        "-ac", "2", "-ar", "22050",
        outputPath,
      ]);

      const rawData = await fs.readFile(outputPath);
      const float32 = new Float32Array(rawData.buffer, rawData.byteOffset, rawData.byteLength / 4);

      // Deinterleave stereo channels
      const samplesPerChannel = float32.length / 2;
      const left = new Float32Array(samplesPerChannel);
      const right = new Float32Array(samplesPerChannel);
      for (let i = 0; i < samplesPerChannel; i++) {
        left[i] = float32[i * 2]!;
        right[i] = float32[i * 2 + 1]!;
      }

      const result = calculateWaveform(float32, 2, [left, right]);

      // Cache result
      waveformCache.set(soundId, result);

      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.json(result);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (err) {
    console.error("Waveform calculation failed:", err);
    // Return empty waveform instead of erroring
    const empty = { max: 0, peaks: Array(100).fill(0) };
    return res.json(empty);
  }
});
