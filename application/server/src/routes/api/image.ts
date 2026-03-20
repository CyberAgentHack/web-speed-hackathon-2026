import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import piexif from "piexifjs";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "jpg";

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
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  // アップロード画像のEXIFからalt(ImageDescription)を抽出する
  // Image DBレコードはPOST /postsのSequelize includeで作成される
  const alt = extractAltFromExif(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
