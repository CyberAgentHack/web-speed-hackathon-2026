import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import {
  OPTIMIZED_IMAGE_EXTENSION,
  optimizeImageToWebp,
} from "@web-speed-hackathon-2026/server/src/utils/optimize_image";
import { extractImageAlt } from "@web-speed-hackathon-2026/server/src/utils/image_alt";

const EXTENSION = OPTIMIZED_IMAGE_EXTENSION;

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }
  const body = req.body;

  const type = await fileTypeFromBuffer(body);
  if (type === undefined || type.mime.startsWith("image/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const alt = await extractImageAlt(body);
  const converted = await optimizeImageToWebp(body);
  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, converted);
  await Image.create({ alt, id: imageId });

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
