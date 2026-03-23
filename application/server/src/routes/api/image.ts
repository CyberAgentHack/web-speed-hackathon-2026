import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import exifReader from "exif-reader";

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

  try {
    const imageId = uuidv4();
    const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });

    const imageProcessor = sharp(req.body);
    const metadata = await imageProcessor.metadata();

    let alt = "";
    if (metadata.exif) {
      try {
        const exifData = exifReader(metadata.exif);
        // @ts-ignore: exif-reader types might be loose
        alt = exifData?.image?.ImageDescription || "";
      } catch (e) {
        console.warn("Failed to parse EXIF:", e);
      }
    }

    await imageProcessor
      .clone()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80, lossless: false })
      .toFile(filePath);

    // Create DB record
    await Image.create({
      id: imageId,
      alt: alt || "Uploaded image",
      width: metadata.width || 0,
      height: metadata.height || 0,
    });

    return res.status(200).type("application/json").send({ id: imageId });
  } catch (error) {
    console.error("Image processing error:", error);
    throw new httpErrors.BadRequest("Invalid image or processing failed");
  }
});
