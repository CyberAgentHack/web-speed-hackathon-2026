import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== "jpg") {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const imagesDir = path.resolve(UPLOAD_PATH, "images");
  await fs.mkdir(imagesDir, { recursive: true });
  // JPG で保存 + クライアントが .webp で参照するため同じ内容を .webp でも保存
  await fs.writeFile(path.resolve(imagesDir, `${imageId}.jpg`), req.body);
  await fs.writeFile(path.resolve(imagesDir, `${imageId}.webp`), req.body);

  return res.status(200).type("application/json").send({ id: imageId });
});
