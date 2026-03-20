import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { computePeaks } from "@web-speed-hackathon-2026/server/src/utils/compute_peaks";
import { convertSound } from "@web-speed-hackathon-2026/server/src/utils/convert_sound";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // Extract metadata from the original file before conversion
  const { artist, title } = await extractMetadataFromSound(req.body);

  // Convert to MP3 with metadata
  const converted = await convertSound(req.body, { artist, title });

  const soundId = uuidv4();

  const peaks = await computePeaks(converted);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ artist, id: soundId, peaks, title });
});
