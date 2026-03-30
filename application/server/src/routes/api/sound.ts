import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { createSoundWave, extractMetadataFromSound, tinifyAudio } from "../../medias/audio";

const AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/aac",
  "audio/ogg",
  "audio/mp4",
  "application/ogg",
]);

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !AUDIO_MIMES.has(type.mime)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const originalFilePath = path.resolve(UPLOAD_PATH, `./sounds/_orig/${soundId}.${type.ext}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds/_orig"), { recursive: true });
  await fs.writeFile(originalFilePath, req.body);

  await tinifyAudio(originalFilePath, path.resolve(UPLOAD_PATH, `./sounds/${soundId}.opus`));

  const { artist, title } = await extractMetadataFromSound(originalFilePath);
  const soundWave = await createSoundWave(originalFilePath);

  return res.status(200).type("application/json").send({ artist, id: soundId, title, soundWave });
});
