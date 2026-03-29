import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
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
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images/optimized"), { recursive: true });

  const originalFilePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  const optimizedFilePath = path.resolve(UPLOAD_PATH, `./images/optimized/${imageId}.${EXTENSION}`);

  await Promise.all([
    fs.writeFile(originalFilePath, req.body),
    fs.writeFile(optimizedFilePath, req.body),
  ]);

  return res.status(200).type("application/json").send({ id: imageId });
});
