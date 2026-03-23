import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const SUPPORTED_EXTENSIONS = new Set(["mp3", "wav"]);

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !SUPPORTED_EXTENSIONS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${type.ext}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
