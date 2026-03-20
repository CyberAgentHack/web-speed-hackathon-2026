import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { uploadFileToS3 } from "@web-speed-hackathon-2026/server/src/utils/s3";

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
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(req.body);

  await uploadFileToS3(`sounds/${soundId}.${EXTENSION}`, req.body, type.mime);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
