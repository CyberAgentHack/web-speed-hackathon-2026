import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { convertToMp3 } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";

const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // メタデータを先に抽出（music-metadataは多くの形式をサポート）
  const { artist, title } = await extractMetadataFromSound(req.body);

  // サーバーサイドでMP3に変換（クライアントWASM不要）
  const converted = await convertToMp3(
    req.body,
    artist ?? "Unknown Artist",
    title ?? "Unknown Title",
  );

  const soundId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
