import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const OUTPUT_EXTENSION = "avif";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const imageId = uuidv4();

  // Extract EXIF ImageDescription as alt text
  let alt = "";
  try {
    const exifr = await import("exifr");
    const exif = await exifr.parse(req.body, { pick: ["ImageDescription"] });
    if (exif?.ImageDescription) {
      alt = String(exif.ImageDescription);
    }
  } catch {
    // No EXIF or parse error
  }

  // Convert any image format (TIFF, PNG, WebP, etc.) to AVIF using sharp
  const avifBuffer = await sharp(req.body).avif({ quality: 50 }).toBuffer();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${OUTPUT_EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, avifBuffer);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
