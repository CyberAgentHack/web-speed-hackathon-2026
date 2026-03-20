import { promises as fs } from "fs";
import path from "path";

import exifReader from "exif-reader";
import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "avif";

function extractAltFromExif(exifBuffer: Buffer): string {
  try {
    const parsed = exifReader(exifBuffer);
    const desc = parsed.Image?.ImageDescription;
    if (Buffer.isBuffer(desc)) {
      const nullIdx = desc.indexOf(0);
      return desc.subarray(0, nullIdx === -1 ? undefined : nullIdx).toString("utf-8");
    }
    if (typeof desc === "string") {
      return desc;
    }
  } catch {
    // ignore
  }
  return "";
}

function extractAltFromTiffIfd(buf: Buffer): string {
  try {
    const bo = buf.readUInt16BE(0);
    const isLE = bo === 0x4949;
    const read16 = isLE ? (o: number) => buf.readUInt16LE(o) : (o: number) => buf.readUInt16BE(o);
    const read32 = isLE ? (o: number) => buf.readUInt32LE(o) : (o: number) => buf.readUInt32BE(o);

    const ifdOffset = read32(4);
    const numEntries = read16(ifdOffset);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      const tag = read16(entryOffset);
      if (tag === 0x010e) {
        const count = read32(entryOffset + 4);
        const valueOffset = count > 4 ? read32(entryOffset + 8) : entryOffset + 8;
        return buf.subarray(valueOffset, valueOffset + count - 1).toString("utf-8");
      }
    }
  } catch {
    // ignore
  }
  return "";
}

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const metadata = await sharp(req.body).metadata();

  if (metadata.format === undefined) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  let alt = metadata.exif ? extractAltFromExif(metadata.exif) : "";
  if (alt === "" && metadata.format === "tiff") {
    alt = extractAltFromTiffIfd(req.body);
  }

  const imageId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await sharp(req.body).avif({ quality: 50, effort: 2 }).toFile(filePath);
  await Image.create({ id: imageId, alt });

  return res.status(200).type("application/json").send({ id: imageId });
});
