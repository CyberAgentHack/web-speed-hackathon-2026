import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractAltFromMedia, tinifyTheImage } from "../../medias/image";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !type.mime.startsWith("image/")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const originalImageFile = path.resolve(UPLOAD_PATH, `./images/_orig/${imageId}.${type.ext}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images", "_orig"), { recursive: true });
  await fs.writeFile(originalImageFile, req.body);

  const publishingImageFile = path.resolve(UPLOAD_PATH, `./images/${imageId}.webp`);
  await tinifyTheImage(originalImageFile, publishingImageFile);

  const alt = await extractAltFromMedia(originalImageFile);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
