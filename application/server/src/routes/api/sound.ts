import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertSound, extractMetadataFromSound } from "../../utils/convert_sound";

// 変換した音声の拡張子
const EXTENSION = "wav";

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

  const { artist, title } = await extractMetadataFromSound(req.body);

  const converted = await convertSound(req.body);

  const soundId = uuidv4();

  console.log(`Extracted metadata - Artist: ${artist}, Title: ${title}`);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.mp3`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
