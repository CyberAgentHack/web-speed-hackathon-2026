import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const POST_SIZES = [320, 640, 960];
const WEBP_QUALITY = 80;

function extractImageDescription(exifBuffer: Buffer | undefined): string {
  if (!exifBuffer || exifBuffer.length < 10) return "";

  let offset = 0;
  // Check for "Exif\0\0" prefix (present when EXIF is from JPEG)
  if (exifBuffer[0] === 0x45 && exifBuffer[1] === 0x78 && exifBuffer[2] === 0x69 && exifBuffer[3] === 0x66) {
    offset = 6;
  }

  const isLE = exifBuffer[offset] === 0x49 && exifBuffer[offset + 1] === 0x49;
  const isBE = exifBuffer[offset] === 0x4d && exifBuffer[offset + 1] === 0x4d;
  if (!isLE && !isBE) return "";

  const readUint16 = (pos: number) => (isLE ? exifBuffer.readUInt16LE(pos) : exifBuffer.readUInt16BE(pos));
  const readUint32 = (pos: number) => (isLE ? exifBuffer.readUInt32LE(pos) : exifBuffer.readUInt32BE(pos));

  const tiffOffset = offset;
  const ifdOffset = readUint32(tiffOffset + 4);
  const entryCount = readUint16(tiffOffset + ifdOffset);

  for (let i = 0; i < entryCount; i++) {
    const entryPos = tiffOffset + ifdOffset + 2 + i * 12;
    const tag = readUint16(entryPos);

    if (tag === 0x010e) {
      // ImageDescription tag, type ASCII (2)
      const count = readUint32(entryPos + 4);
      const valueOffset = count <= 4 ? entryPos + 8 : tiffOffset + readUint32(entryPos + 8);
      return exifBuffer
        .subarray(valueOffset, valueOffset + count)
        .toString("utf8")
        .replace(/\0+$/, "");
    }
  }

  return "";
}

export const imageRouter = Router();

imageRouter.get("/images/:imageId/alt", async (req, res) => {
  const image = await Image.findByPk(req.params.imageId);
  if (image === null) {
    throw new httpErrors.NotFound();
  }
  return res.status(200).type("application/json").send({ alt: image.alt });
});

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // Extract EXIF description before any processing
  const metadata = await sharp(req.body).metadata();
  const alt = extractImageDescription(metadata.exif);

  const imageId = uuidv4();

  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });

  await Promise.all(
    POST_SIZES.map((width) => {
      const outPath = path.resolve(UPLOAD_PATH, `./images/${imageId}-${width}w.webp`);
      return sharp(req.body)
        .resize(width, undefined, { withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);
    }),
  );

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
