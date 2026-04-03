import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import piexif from "piexifjs";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "jpg";

function extractAltFromExif(buffer: Buffer): string {
  try {
    const binary = buffer.toString("binary");
    const exif = piexif.load(binary);
    const raw = exif?.["0th"]?.[piexif.ImageIFD.ImageDescription];
    if (raw != null) {
      return Buffer.from(raw, "binary").toString("utf-8");
    }
  } catch {
    // EXIF解析に失敗した場合は空文字を返す
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

  const alt = extractAltFromExif(req.body);
  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
