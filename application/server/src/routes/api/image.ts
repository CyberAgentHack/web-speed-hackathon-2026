import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import {
  convertImageToWebp,
  extractImageDescription,
} from "@web-speed-hackathon-2026/server/src/utils/media_conversion";

const OUTPUT_EXTENSION = "webp";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("image/") !== true) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();
  const alt = await extractImageDescription(req.body, type.ext);
  const converted = await convertImageToWebp(req.body, type.ext);

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${OUTPUT_EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
