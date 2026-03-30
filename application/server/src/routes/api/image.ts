import { promises as fs } from "fs";
import path from "path";

import exifr from "exifr";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models/Image";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "webp";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("image/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  let alt = "";
  let width = 0;
  let height = 0;

  try {
    const metadata = await sharp(req.body).metadata();
    width = metadata.width || 0;
    height = metadata.height || 0;
    const exif = await exifr.parse(req.body).catch(() => null);
    alt = exif?.ImageDescription || "";
  } catch (e) {
    console.warn("Failed to extract image metadata", e);
  }

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  
  await sharp(req.body).webp().toFile(filePath);

  await Image.create({
    id: imageId,
    alt,
    width,
    height,
  });

  return res.status(200).type("application/json").send({ id: imageId });
});
