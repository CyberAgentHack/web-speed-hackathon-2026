import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

// 変換した音声の拡張子
const EXTENSION = "mp3";

function computePeaks(mp3Path: string): { max: number; peaks: number[] } {
  const buf = execSync(`ffmpeg -i "${mp3Path}" -f f32le -ac 1 -ar 22050 - 2>/dev/null`, {
    maxBuffer: 100 * 1024 * 1024,
  });
  const samples = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  const chunkSize = Math.ceil(samples.length / 100);
  const peaks: number[] = [];
  for (let i = 0; i < samples.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, samples.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += Math.abs(samples[j]!);
    }
    peaks.push(sum / (end - i));
  }
  const max = Math.max(...peaks, 0);
  return { max, peaks };
}

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(req.body);

  const soundsDir = path.resolve(UPLOAD_PATH, "sounds");
  await fs.mkdir(soundsDir, { recursive: true });

  const filePath = path.resolve(soundsDir, `${soundId}.${EXTENSION}`);
  await fs.writeFile(filePath, req.body);

  const peaksData = computePeaks(filePath);
  const peaksPath = path.resolve(soundsDir, `${soundId}.peaks.json`);
  await fs.writeFile(peaksPath, JSON.stringify(peaksData));

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
