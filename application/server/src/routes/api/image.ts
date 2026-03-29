import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import exifr from "exifr";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "jpg";

export const imageRouter = Router();

imageRouter.get("/images/:id", async (req, res) => {
  const { id } = req.params;

  // アップロード済み画像: サイドカー JSON から取得
  try {
    const sidecar = await fs.readFile(path.resolve(UPLOAD_PATH, `images/${id}.json`), "utf-8");
    const alt: string = JSON.parse(sidecar).alt ?? "";
    return res.status(200).type("application/json").send({ alt });
  } catch { /* fall through to EXIF */ }

  // シード画像: JPEG の EXIF から取得
  let buffer: Buffer | null = null;
  for (const filePath of [
    path.resolve(PUBLIC_PATH, `images/${id}.${EXTENSION}`),
    path.resolve(UPLOAD_PATH, `images/${id}.${EXTENSION}`),
  ]) {
    try { buffer = await fs.readFile(filePath); break; } catch { /* next */ }
  }
  if (!buffer) throw new httpErrors.NotFound();

  const exif = await exifr.parse(buffer, ["ImageDescription"]).catch(() => null);
  const alt: string = exif?.ImageDescription ?? "";

  return res.status(200).type("application/json").send({ alt });
});

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const exif = await exifr.parse(req.body, ["ImageDescription"]).catch(() => null);
  const alt: string = exif?.ImageDescription ?? "";

  let jpegBuffer: Buffer;
  try {
    jpegBuffer = await sharp(req.body).withMetadata().jpeg().toBuffer();
  } catch {
    throw new httpErrors.BadRequest("Invalid image");
  }

  const imageId = uuidv4();

  const dir = path.resolve(UPLOAD_PATH, "images");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.resolve(dir, `${imageId}.${EXTENSION}`), jpegBuffer);
  await fs.writeFile(path.resolve(dir, `${imageId}.json`), JSON.stringify({ alt }));

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
