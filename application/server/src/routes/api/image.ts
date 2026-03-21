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
  const startedAt = Date.now();
  const alt = decodeURIComponent(req.get("X-Image-Alt") ?? "");

  if (req.session.userId === undefined) {
    console.warn("[api/images] unauthorized");
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    console.warn("[api/images] invalid body", { bodyType: typeof req.body });
    throw new httpErrors.BadRequest();
  }

  console.info("[api/images] start", {
    alt,
    altLength: alt.length,
    bytes: req.body.length,
    userId: req.session.userId,
  });

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("image/") === false) {
    console.warn("[api/images] invalid file type", { type: type?.mime });
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const outputDir = path.resolve(UPLOAD_PATH, "./images");
  await fs.mkdir(outputDir, { recursive: true });
  await writeResponsiveImageVariants(req.body, outputDir, imageId);

  console.info("[api/images] success", {
    alt,
    altLength: alt.length,
    elapsedMs: Date.now() - startedAt,
    imageId,
    mime: type.mime,
    userId: req.session.userId,
  });

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
