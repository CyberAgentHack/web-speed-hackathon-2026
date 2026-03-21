import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { getDb } from "@web-speed-hackathon-2026/server/src/db/client";
import * as schema from "@web-speed-hackathon-2026/server/src/db/schema";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { calculateSoundWave } from "@web-speed-hackathon-2026/server/src/utils/calculate_sound_wave";
import { convertSoundToMp3 } from "@web-speed-hackathon-2026/server/src/utils/convert_sound_to_mp3";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

// 変換した音声の拡張子
const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // FFmpegでMP3に変換
  let mp3Buffer: Buffer;
  try {
    mp3Buffer = await convertSoundToMp3(req.body);
  } catch {
    throw new httpErrors.BadRequest("Failed to convert audio file");
  }

  const soundId = uuidv4();

  // メタデータ抽出
  const { artist, title } = await extractMetadataFromSound(mp3Buffer);

  // 波形データ計算
  const { max, peaks } = await calculateSoundWave(new Uint8Array(mp3Buffer).buffer);

  // ファイル保存
  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, mp3Buffer);

  // Soundレコード作成
  const now = new Date().toISOString();
  await getDb().insert(schema.sounds).values({
    id: soundId,
    artist: artist ?? "Unknown",
    title: title ?? "Unknown",
    max,
    peaks,
    createdAt: now,
    updatedAt: now,
  });

  return res.status(200).type("application/json").send({ id: soundId });
});
