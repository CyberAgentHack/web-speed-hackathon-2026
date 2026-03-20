import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { uploadFileToS3 } from "@web-speed-hackathon-2026/server/src/utils/s3";

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

  await uploadFileToS3(`images/${imageId}.${EXTENSION}`, req.body, type.mime);

  return res.status(200).type("application/json").send({ id: imageId });
});
