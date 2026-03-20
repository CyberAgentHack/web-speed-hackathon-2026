import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertImageToWebP } from "@web-speed-hackathon-2026/server/src/utils/convert_image";
import { extractImageDescription } from "@web-speed-hackathon-2026/server/src/utils/extract_image_description";

const EXTENSION = "webp";
const THUMB_EXTENSION = "thumb.webp";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  let imageBuffer: Buffer;
  let alt = "";
  try {
    alt = extractImageDescription(req.body);
    imageBuffer = await convertImageToWebP(req.body);
  } catch {
    throw new httpErrors.BadRequest("Invalid image file");
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  const thumbPath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${THUMB_EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await Promise.all([
    fs.writeFile(filePath, imageBuffer),
    fs.writeFile(thumbPath, await convertImageToWebP(req.body, { maxWidth: 640, quality: 72 })),
  ]);

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
