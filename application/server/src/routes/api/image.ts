import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 保存する画像の拡張子
const EXTENSION = "webp";
const ACCEPTED_FORMATS = new Set(["jpg", "png", "webp", "gif"]);

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ACCEPTED_FORMATS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  // リサイズ・WebP変換
  const webpBuffer = await sharp(req.body)
    .resize(800, undefined, { withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, webpBuffer);

  return res.status(200).type("application/json").send({ id: imageId });
});
