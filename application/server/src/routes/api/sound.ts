import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execFileAsync = promisify(execFile);

const EXTENSION = "mp3";
const PEAK_COUNT = 100;

interface PeaksData {
  max: number;
  peaks: number[];
}

function findChunk(buf: Buffer, startOffset: number, id: string): { offset: number; size: number } | null {
  let pos = startOffset;
  while (pos < buf.length - 8) {
    const chunkId = buf.toString("ascii", pos, pos + 4);
    const chunkSize = buf.readUInt32LE(pos + 4);
    if (chunkId === id) {
      return { offset: pos + 8, size: chunkSize };
    }
    pos += 8 + chunkSize;
    if (chunkSize % 2 !== 0) pos++;
  }
  return null;
}

function computePeaksFromWav(buf: Buffer): PeaksData | null {
  if (buf.length < 44) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return null;

  const fmt = findChunk(buf, 12, "fmt ");
  const data = findChunk(buf, 12, "data");
  if (!fmt || !data) return null;

  const audioFormat = buf.readUInt16LE(fmt.offset);
  if (audioFormat !== 1) return null;

  const numChannels = buf.readUInt16LE(fmt.offset + 2);
  const bitsPerSample = buf.readUInt16LE(fmt.offset + 14);
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(data.size / (bytesPerSample * numChannels));
  if (totalSamples === 0) return null;

  const chunkSize = Math.ceil(totalSamples / PEAK_COUNT);
  const peaks: number[] = [];
  const dataStart = data.offset;

  for (let i = 0; i < totalSamples; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, totalSamples);
    for (let j = i; j < end; j++) {
      let mono = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        const off = dataStart + (j * numChannels + ch) * bytesPerSample;
        if (off + bytesPerSample > buf.length) break;
        let s: number;
        if (bitsPerSample === 16) {
          s = buf.readInt16LE(off) / 32768;
        } else if (bitsPerSample === 8) {
          s = (buf[off]! - 128) / 128;
        } else if (bitsPerSample === 24) {
          s = ((buf[off + 2]! << 24) | (buf[off + 1]! << 16) | (buf[off]! << 8)) >> 8;
          s /= 8388608;
        } else if (bitsPerSample === 32) {
          s = buf.readInt32LE(off) / 2147483648;
        } else {
          s = 0;
        }
        mono += s;
      }
      sum += Math.abs(mono / numChannels);
    }
    peaks.push(sum / (end - i));
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

  return { max, peaks };
}

async function generatePeaksFfmpeg(mp3Path: string, peaksPath: string): Promise<void> {
  const { stdout } = await execFileAsync(
    "ffmpeg",
    ["-i", mp3Path, "-f", "f32le", "-ac", "1", "-ar", "22050", "-"],
    { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 },
  );

  const samples = new Float32Array(stdout.buffer, stdout.byteOffset, stdout.byteLength / 4);
  const len = samples.length;
  const chunkSize = Math.ceil(len / PEAK_COUNT);
  const peaks: number[] = [];

  for (let i = 0; i < len; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, len);
    for (let j = i; j < end; j++) {
      sum += Math.abs(samples[j]!);
    }
    peaks.push(sum / (end - i));
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

  await fs.writeFile(peaksPath, JSON.stringify({ max, peaks }));
}

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const inputBuffer = req.body as Buffer;

  // Extract metadata from the original file
  const { artist, title } = await extractMetadataFromSound(inputBuffer);

  const soundId = uuidv4();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const tmpInput = path.join(tmpDir, "input");
  const tmpOutput = path.join(tmpDir, `output.${EXTENSION}`);

  try {
    await fs.writeFile(tmpInput, inputBuffer);

    await execFileAsync("ffmpeg", [
      "-i", tmpInput,
      "-y",
      "-vn",
      "-codec:a", "libmp3lame",
      "-q:a", "2",
      tmpOutput,
    ]);

    const mp3Buffer = await fs.readFile(tmpOutput);

    const soundsDir = path.resolve(UPLOAD_PATH, "sounds");
    await fs.mkdir(soundsDir, { recursive: true });

    const filePath = path.resolve(soundsDir, `${soundId}.${EXTENSION}`);
    await fs.writeFile(filePath, mp3Buffer);

  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  // Generate peaks in background (non-blocking)
  const peaksPath = path.resolve(UPLOAD_PATH, "sounds", `${soundId}.peaks.json`);
  const wavPeaks = computePeaksFromWav(inputBuffer);
  if (wavPeaks) {
    fs.writeFile(peaksPath, JSON.stringify(wavPeaks)).catch(() => {});
  } else {
    const mp3Path = path.resolve(UPLOAD_PATH, "sounds", `${soundId}.${EXTENSION}`);
    generatePeaksFfmpeg(mp3Path, peaksPath).catch(() => {});
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
