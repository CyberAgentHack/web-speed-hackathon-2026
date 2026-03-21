import { promises as fs } from "fs";
import path from "path";

import exifr from "exifr";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
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
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  // exifr は WebP の EXIF にも対応
  // ImageMagick が ImageDescription を Comment に移すため、両方確認する
  let alt = "";
  try {
    const exifData = await exifr.parse(req.body);
    alt = exifData?.ImageDescription || exifData?.Comment || "";
  } catch {
    // EXIF データがない場合は空文字
  }

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
