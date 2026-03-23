import { promises as fs } from "fs";
import path from "path";

import exifr from "exifr";
import { Router } from "express";
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

  let alt = "";
  try {
    const exifData = await exifr.parse(req.body, { pick: ["ImageDescription"] });
    if (exifData?.ImageDescription) {
      alt = exifData.ImageDescription;
    }
  } catch {
    // EXIF extraction failed, use empty alt
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });

  await sharp(req.body).jpeg().toFile(filePath);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
