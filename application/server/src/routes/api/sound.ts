import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { convertSoundToM4a } from "@web-speed-hackathon-2026/server/src/utils/media_conversion";

const OUTPUT_EXTENSION = "m4a";
const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("audio/") !== true) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const rawMetadata = await extractMetadataFromSound(req.body);
  const artist = rawMetadata.artist ?? UNKNOWN_ARTIST;
  const title = rawMetadata.title ?? UNKNOWN_TITLE;
  const converted = await convertSoundToM4a(req.body, type.ext, { artist, title });

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${OUTPUT_EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
