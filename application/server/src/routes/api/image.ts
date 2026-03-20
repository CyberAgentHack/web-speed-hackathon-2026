import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import exifr from "exifr";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "jpg";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  let jpegBuffer: Buffer;
  try {
    jpegBuffer = await sharp(req.body).withMetadata().jpeg().toBuffer();
  } catch {
    throw new httpErrors.BadRequest("Invalid image");
  }

  const exif = await exifr.parse(req.body, ["ImageDescription"]).catch(() => null);
  const alt: string = exif?.ImageDescription ?? "";

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, jpegBuffer);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
