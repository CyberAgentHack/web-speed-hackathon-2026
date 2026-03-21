import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { writeResponsiveImageVariants } from "@web-speed-hackathon-2026/server/src/utils/image_variants";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  const alt = decodeURIComponent(req.get("X-Image-Alt") ?? "");

  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("image/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const outputDir = path.resolve(UPLOAD_PATH, "./images");
  await fs.mkdir(outputDir, { recursive: true });
  await writeResponsiveImageVariants(req.body, outputDir, imageId);

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
