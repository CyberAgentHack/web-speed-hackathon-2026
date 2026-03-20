import { promises as fs } from "fs";
import path from "path";

import exifReader from "exif-reader";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
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
  if (type === undefined || !type.mime.startsWith("image/")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  // EXIF から alt テキストを抽出
  let alt = "";
  const metadata = await sharp(req.body).metadata();
  if (metadata.exif != null) {
    try {
      const parsed = exifReader(metadata.exif);
      const desc = parsed?.Image?.ImageDescription;
      if (typeof desc === "string") {
        alt = desc;
      }
    } catch {
      // EXIF パース失敗時は alt 空のまま
    }
  }

  // WebP に変換
  const webpBuffer = await sharp(req.body).webp({ quality: 80 }).toBuffer();

  const filePath = path.resolve(
    UPLOAD_PATH,
    `./images/${imageId}.${EXTENSION}`,
  );
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, webpBuffer);

  // DB に画像レコードを作成
  await Image.create({ id: imageId, alt });

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
