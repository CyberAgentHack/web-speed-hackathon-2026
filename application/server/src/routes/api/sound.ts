import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertSoundToMp3 } from "@web-speed-hackathon-2026/server/src/utils/transcode_media";

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

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("audio/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  let convertedSoundBuffer: Buffer;
  let artist: string;
  let title: string;
  try {
    const result = await convertSoundToMp3(req.body);
    convertedSoundBuffer = result.audio;
    artist = result.artist;
    title = result.title;
  } catch (error) {
    console.error("Sound conversion failed:", error);
    throw new httpErrors.BadRequest("Invalid sound content");
  }

  const filePath = path.resolve(
    UPLOAD_PATH,
    `./sounds/${soundId}.${EXTENSION}`,
  );
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, convertedSoundBuffer);

  return res.status(200).type("application/json").send({
    artist,
    id: soundId,
    title,
  });
});
