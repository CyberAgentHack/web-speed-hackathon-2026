import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertImageToJpeg } from "@web-speed-hackathon-2026/server/src/utils/convert_image";

// 変換した画像の拡張子
const EXTENSION = "jpg";
const ALLOWED_TYPES = ["jpg", "png", "tif", "gif", "webp", "bmp"];

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ALLOWED_TYPES.includes(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  let imageBuffer: Buffer = req.body;
  if (type.ext !== "jpg") {
    imageBuffer = await convertImageToJpeg(req.body);
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, imageBuffer);

  return res.status(200).type("application/json").send({ id: imageId });
});
