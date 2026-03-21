import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

import ffmpegPath from "ffmpeg-static";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { CACHE_PATH, PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertSound } from "@web-speed-hackathon-2026/server/src/utils/convert_sound";

const execFileAsync = promisify(execFile);

// 変換した音声の拡張子
const EXTENSION = "mp3";

export const soundRouter = Router();

async function findSoundFile(soundId: string): Promise<string | null> {
  const filename = `${soundId}.${EXTENSION}`;
  for (const dir of [
    path.resolve(UPLOAD_PATH, "sounds"),
    path.resolve(PUBLIC_PATH, "sounds"),
  ]) {
    const filePath = path.join(dir, filename);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // not found in this directory
    }
  }
  return null;
}

async function computeWaveformPeaks(filePath: string): Promise<{ peaks: number[]; max: number }> {
  await fs.mkdir(CACHE_PATH, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(CACHE_PATH, "waveform-"));
  const outputPath = path.join(tmpDir, "output.pcm");

  try {
    await execFileAsync(ffmpegPath!, [
      "-y", "-i", filePath,
      "-f", "f32le", "-ac", "1", "-ar", "4000",
      outputPath,
    ]);
    const pcmBuffer = await fs.readFile(outputPath);
    const samples = new Float32Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 4);
    const absData = Array.from(samples, Math.abs);

    const numPeaks = 100;
    const chunkSize = Math.ceil(absData.length / numPeaks);
    const peaks: number[] = [];
    for (let i = 0; i < numPeaks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, absData.length);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += absData[j]!;
      }
      peaks.push(sum / (end - start));
    }
    const max = Math.max(...peaks, 0);
    return { peaks, max };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// メモリキャッシュ
const peaksCache = new Map<string, { peaks: number[]; max: number }>();

soundRouter.get("/sounds/:soundId/peaks", async (req, res) => {
  const soundId = req.params.soundId!;

  // メモリキャッシュチェック
  const cached = peaksCache.get(soundId);
  if (cached) {
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.status(200).type("application/json").send(cached);
  }

  // ディスクキャッシュチェック
  const cachePath = path.resolve(CACHE_PATH, `peaks/${soundId}.json`);
  try {
    const data = await fs.readFile(cachePath, "utf-8");
    const parsed = JSON.parse(data);
    peaksCache.set(soundId, parsed);
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.status(200).type("application/json").send(parsed);
  } catch {
    // no disk cache
  }

  const filePath = await findSoundFile(soundId);
  if (!filePath) {
    throw new httpErrors.NotFound();
  }

  const result = await computeWaveformPeaks(filePath);
  peaksCache.set(soundId, result);

  // ディスクキャッシュに保存
  await fs.mkdir(path.resolve(CACHE_PATH, "peaks"), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(result));

  res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  return res.status(200).type("application/json").send(result);
});

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const { buffer: converted, artist, title } = await convertSound(req.body);

  const soundId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
