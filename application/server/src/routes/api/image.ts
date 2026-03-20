import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import exifr from "exifr";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

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
  if (type === undefined || type.mime.startsWith("image/") !== true) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const metadata = await sharp(req.body).metadata();
  if (metadata.width == null || metadata.height == null) {
    throw new httpErrors.BadRequest("Invalid image metadata");
  }

  const exif = await exifr.parse(req.body, true);
  const altRaw = exif?.ImageDescription;
  const alt = typeof altRaw === "string" ? altRaw : "";

  const convertedImage = await sharp(req.body)
    .resize({ width: 800, fit: "cover" }).webp({ quality: 85 })
    .withMetadata().toBuffer();

  const imageId = uuidv4();

  const filePath = path.resolve(
    UPLOAD_PATH,
    `./images/${imageId}.${EXTENSION}`,
  );
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, convertedImage);

  return res.status(200).type("application/json").send({
    alt,
    height: metadata.height,
    id: imageId,
    width: metadata.width,
  });
});
