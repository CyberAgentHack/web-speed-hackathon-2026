import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { getDb } from "@web-speed-hackathon-2026/server/src/db/client";
import * as schema from "@web-speed-hackathon-2026/server/src/db/schema";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractImageMetadata } from "@web-speed-hackathon-2026/server/src/utils/extract_image_metadata";

const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "png", "webp", "tiff", "avif"]);

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ALLOWED_IMAGE_EXTENSIONS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${type.ext}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  const { alt, width, height } = await extractImageMetadata(req.body);
  const now = new Date().toISOString();

  await getDb().insert(schema.images).values({ id: imageId, alt, width, height, createdAt: now, updatedAt: now });

  return res.status(200).type("application/json").send({ id: imageId, alt, width, height });
});
