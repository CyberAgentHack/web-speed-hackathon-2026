import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertImage } from "../../utils/convert_image";
import { MagickFormat } from "@imagemagick/magick-wasm";

// 変換した画像の拡張子
const OUT_EXTENSION = "jpg";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const imageId = uuidv4();
  const outDir = path.resolve(UPLOAD_PATH, "images");
  const filePath = path.resolve(outDir, `${imageId}.${OUT_EXTENSION}`);
  await fs.mkdir(outDir, { recursive: true });

  try {
    const buffer = Buffer.from(req.body);

    const converted = await convertImage(buffer, {
      extension: MagickFormat.Jpg,
    });

    await fs.writeFile(filePath, converted);

    return res.status(200).type("application/json").send({ id: imageId });
  } catch (e) {
    console.error("Error processing image:", e);
    throw new httpErrors.InternalServerError("Failed to process image");
  }
});
