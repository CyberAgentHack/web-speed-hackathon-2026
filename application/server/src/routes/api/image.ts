import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractImageDescription } from "@web-speed-hackathon-2026/server/src/utils/extract_image_description";

const EXTENSION = "webp";
const POST_IMAGE_WIDTHS = [320, 640, 1280];

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // Extract alt text from TIFF ImageDescription before conversion
  const alt = extractImageDescription(req.body);

  // Convert any image format to WebP using sharp
  const webpBuffer = await sharp(req.body).webp({ quality: 80 }).toBuffer();

  const imageId = uuidv4();

  const imagesDir = path.resolve(UPLOAD_PATH, "images");
  await fs.mkdir(imagesDir, { recursive: true });

  const filePath = path.resolve(imagesDir, `${imageId}.${EXTENSION}`);
  await fs.writeFile(filePath, webpBuffer);

  // Generate resized variants for srcset
  const metadata = await sharp(webpBuffer).metadata();
  await Promise.all(
    POST_IMAGE_WIDTHS.filter((w) => (metadata.width ?? 0) > w).map((w) =>
      sharp(webpBuffer)
        .resize(w)
        .webp({ quality: 80 })
        .toFile(path.resolve(imagesDir, `${imageId}_w${w}.${EXTENSION}`)),
    ),
  );

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
