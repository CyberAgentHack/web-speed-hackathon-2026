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

const extractImageAlt = (buffer: Buffer): string => {
  try {
    const exif = piexif.load(buffer.toString("binary"));
    const rawAlt = exif?.["0th"]?.[piexif.ImageIFD.ImageDescription];

    if (typeof rawAlt !== "string" || rawAlt.length === 0) {
      return "";
    }

    return Buffer.from(rawAlt, "binary").toString("utf8");
  } catch {
    return "";
  }
};

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
  const alt = extractImageAlt(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
