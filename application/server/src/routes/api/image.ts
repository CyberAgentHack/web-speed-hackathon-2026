import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "jpg";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !type.mime.startsWith("image/")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();
  const tempDir = path.resolve(UPLOAD_PATH, "tmp");
  await fs.mkdir(tempDir, { recursive: true });

  const sourceExtension = type.ext || "bin";
  const tempSourcePath = path.resolve(tempDir, `${imageId}-src.${sourceExtension}`);
  const tempOutputPath = path.resolve(tempDir, `${imageId}-out.${EXTENSION}`);

  await fs.writeFile(tempSourcePath, req.body);

  try {
    await sharp(tempSourcePath).jpeg({ quality: 90, mozjpeg: true }).toFile(tempOutputPath);

    const finalFilePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
    await fs.rename(tempOutputPath, finalFilePath);

    return res.status(200).type("application/json").send({ id: imageId });
  } catch (err) {
    console.error("image conversion failed:", err);
    throw new httpErrors.InternalServerError("Image conversion failed");
  } finally {
    await fs.rm(tempSourcePath, { force: true }).catch(() => undefined);
    await fs.rm(tempOutputPath, { force: true }).catch(() => undefined);
  }
});
