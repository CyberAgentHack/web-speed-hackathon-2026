import { promises as fs } from "fs";
import path from "path";

import exifr from "exifr";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 受け付ける画像 MIME タイプ
const ACCEPTED_IMAGE_TYPES = new Set(["jpg", "png", "webp", "gif", "avif", "heic", "tif"]);
// 最大出力サイズ（px）
const MAX_SIZE = 800;
// WebP 品質
const WEBP_QUALITY = 80;
// 出力拡張子
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
  if (type === undefined || !ACCEPTED_IMAGE_TYPES.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  // アップロード前に EXIF を抽出（sharp 変換後は EXIF が失われる場合があるため）
  let alt = "";
  try {
    const exifData = await exifr.parse(req.body);
    alt = exifData?.ImageDescription || exifData?.Comment || "";
  } catch {
    // EXIF データがない場合は空文字
  }

  // サーバーサイドでリサイズ＋WebP 変換
  const outputBuffer = await sharp(req.body)
    .resize(MAX_SIZE, MAX_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const imageId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, outputBuffer);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
