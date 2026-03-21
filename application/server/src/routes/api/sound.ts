import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execFileAsync = promisify(execFile);

const EXTENSION = "mp3";

const waveformCache = new Map<string, { max: number; peaks: number[] }>();

export async function computeWaveform(soundId: string): Promise<{ max: number; peaks: number[] }> {
  const cached = waveformCache.get(soundId);
  if (cached) return cached;

  let soundPath = path.resolve(UPLOAD_PATH, `sounds/${soundId}.${EXTENSION}`);
  try {
    await fs.access(soundPath);
  } catch {
    soundPath = path.resolve(PUBLIC_PATH, `sounds/${soundId}.${EXTENSION}`);
    await fs.access(soundPath);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveform-"));
  const rawPath = path.join(tmpDir, "output.raw");

  try {
    await execFileAsync(ffmpegPath.path, [
      "-i",
      soundPath,
      "-ac",
      "1",
      "-ar",
      "8000",
      "-f",
      "f32le",
      "-y",
      rawPath,
    ]);

    const rawBuffer = await fs.readFile(rawPath);
    const samples = new Float32Array(
      rawBuffer.buffer,
      rawBuffer.byteOffset,
      rawBuffer.byteLength / 4,
    );

    const chunkSize = Math.ceil(samples.length / 100);
    const peaks: number[] = [];
    let max = 0;
    for (let i = 0; i < samples.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, samples.length);
      let sum = 0;
      for (let j = i; j < end; j++) {
        sum += Math.abs(samples[j]!);
      }
      const mean = sum / (end - i);
      peaks.push(mean);
      if (mean > max) max = mean;
    }

    const result = { max, peaks };
    waveformCache.set(soundId, result);
    return result;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export const soundRouter = Router();

soundRouter.get("/sounds/:soundId/waveform", async (req, res) => {
  const { soundId } = req.params;
  try {
    const result = await computeWaveform(soundId!);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).type("application/json").send(result);
  } catch {
    throw new httpErrors.NotFound();
  }
});

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(req.body);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(inputPath, req.body);

  try {
    const args = ["-i", inputPath, "-y", outputPath];
    if (title) {
      args.splice(-1, 0, "-metadata", `title=${title}`);
    }
    if (artist) {
      args.splice(-1, 0, "-metadata", `artist=${artist}`);
    }
    await execFileAsync(ffmpegPath.path, args);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
