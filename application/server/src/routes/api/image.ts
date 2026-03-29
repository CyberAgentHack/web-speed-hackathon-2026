import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import piexif from "piexifjs";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "webp";
/** アップロード画像の最大辺（px）。これを超える画像はリサイズされる */
const MAX_IMAGE_DIMENSION = 1024;

/**
 * JPEGバイナリからEXIF ImageDescriptionを抽出してalt文字列として返す。
 * 抽出失敗時は空文字を返す。
 */
function extractAltFromExif(buffer: Buffer): string {
  try {
    const binary = buffer.toString("binary");
    const exif = piexif.load(binary);
    const raw = exif?.["0th"]?.[piexif.ImageIFD.ImageDescription];
    if (raw != null) {
      return new TextDecoder().decode(Buffer.from(raw as string, "binary"));
    }
  } catch {
    // EXIF解析不能な画像は空文字
  }
  return "";
}

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  // クライアントはJPGで送信するが、WebP拡張子で保存する（EXIF抽出のためJPGで受け取る）
  if (type === undefined || (type.ext !== "jpg" && type.ext !== "webp")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  // アップロード画像のEXIFからalt(ImageDescription)を抽出する
  // Image DBレコードはPOST /postsのSequelize includeで作成される
  const alt = extractAltFromExif(req.body);

  // sharpでリサイズ+WebP変換（巨大画像のまま配信するとLCPが悪化するため）
  const optimized = await sharp(req.body)
    .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, optimized);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
