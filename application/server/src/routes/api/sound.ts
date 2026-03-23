import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { calculatePeaks } from "@web-speed-hackathon-2026/server/src/utils/calculate_sound_svg";
import { convertSoundToMp3 } from "@web-speed-hackathon-2026/server/src/utils/convert_sound";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

// 変換した音声の拡張子
const EXTENSION = "mp3";

export const soundRouter = Router();

async function findSoundFile(soundId: string): Promise<string> {
  const filename = `sounds/${soundId}.${EXTENSION}`;
  for (const dir of [UPLOAD_PATH, PUBLIC_PATH]) {
    const filePath = path.resolve(dir, filename);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // try next
    }
  }
  throw new httpErrors.NotFound("Sound file not found");
}

// peaks キャッシュ（同じ音声の再計算を避ける）
const peaksCache = new Map<string, { max: number; peaks: number[] }>();

soundRouter.get("/sounds/:soundId/peaks", async (req, res) => {
  const { soundId } = req.params;

  const cached = peaksCache.get(soundId);
  if (cached) {
    return res.status(200).type("application/json").send(cached);
  }

  const filePath = await findSoundFile(soundId);
  const result = await calculatePeaks(filePath);

  peaksCache.set(soundId, result);

  return res.status(200).type("application/json").send(result);
});

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || (!type.mime.startsWith("audio/") && type.ext !== EXTENSION)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  // まずメタデータを抽出（変換前のファイルから）
  const { artist, title } = await extractMetadataFromSound(req.body);

  // MP3 以外の音声ならサーバー側で MP3 に変換
  const mp3Buffer = type.ext === EXTENSION ? req.body : await convertSoundToMp3(req.body, { artist, title });

  const soundId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, mp3Buffer);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
