import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import * as exifr from "exifr";
import httpErrors from "http-errors";
import sharp from "sharp";
import sizeOf from "image-size";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models/Image";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "jpg";

// 許可される拡張子
const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "tiff", "tif", "gif", "webp", "avif", "heic", "heif"
]);

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ALLOWED_EXTENSIONS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  // Extract alt text from EXIF (before conversion)
  let alt = "";
  try {
    const exifData = await exifr.parse(req.body);
    if (exifData?.ImageDescription) {
      alt = String(exifData.ImageDescription);
    }
  } catch {
    // EXIF parsing failed or not present, use empty string
  }

  // Convert to JPEG using sharp
  const converted = await sharp(req.body).jpeg({ quality: 85 }).toBuffer();

  // Get image dimensions from converted image
  const dimensions = sizeOf(converted);
  const width = dimensions?.width ?? 0;
  const height = dimensions?.height ?? 0;

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, converted);

  // Save image record with dimensions and alt text
  await Image.create({ id: imageId, alt, width, height });

  return res.status(200).type("application/json").send({ id: imageId });
});
