import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models/Image";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

function extractAlt(buf: Buffer): string {
  // JPEG: EXIF の ImageDescription (tag 0x010e) を探す
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length - 1) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1]!;
      const segLen = buf.readUInt16BE(offset + 2);
      if (marker === 0xe1) {
        const exifData = buf.subarray(offset + 4, offset + 2 + segLen);
        if (exifData.subarray(0, 4).toString("ascii") !== "Exif") break;
        const tiffStart = 6;
        const isBE = exifData.subarray(tiffStart, tiffStart + 2).toString("ascii") === "MM";
        const readU16 = (pos: number) =>
          isBE ? exifData.readUInt16BE(pos) : exifData.readUInt16LE(pos);
        const readU32 = (pos: number) =>
          isBE ? exifData.readUInt32BE(pos) : exifData.readUInt32LE(pos);
        const ifdOffset = readU32(tiffStart + 4);
        const numEntries = readU16(tiffStart + ifdOffset);
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
          if (readU16(entryOffset) === 0x010e) {
            const count = readU32(entryOffset + 4);
            const valueOffset =
              count <= 4 ? entryOffset + 8 : tiffStart + readU32(entryOffset + 8);
            return exifData
              .subarray(valueOffset, valueOffset + count)
              .toString("utf-8")
              .replace(/\0$/, "");
          }
        }
        break;
      }
      offset += 2 + segLen;
    }
    return "";
  }

  // TIFF: IFD から直接 ImageDescription を探す
  const sig = buf.subarray(0, 2).toString("ascii");
  if (sig === "MM" || sig === "II") {
    const isBE = sig === "MM";
    const readU16 = (pos: number) => (isBE ? buf.readUInt16BE(pos) : buf.readUInt16LE(pos));
    const readU32 = (pos: number) => (isBE ? buf.readUInt32BE(pos) : buf.readUInt32LE(pos));
    const ifdOffset = readU32(4);
    const numEntries = readU16(ifdOffset);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      if (readU16(entryOffset) === 0x010e) {
        const count = readU32(entryOffset + 4);
        const valueOffset = count <= 4 ? entryOffset + 8 : readU32(entryOffset + 8);
        return buf
          .subarray(valueOffset, valueOffset + count)
          .toString("utf-8")
          .replace(/\0$/, "");
      }
    }
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

  const imageId = uuidv4();

  const imagesDir = path.resolve(UPLOAD_PATH, "images");
  await fs.mkdir(imagesDir, { recursive: true });

  const alt = extractAlt(req.body as Buffer);

  const webpPath = path.resolve(imagesDir, `${imageId}.webp`);
  await sharp(req.body)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(webpPath);

  await Image.create({ id: imageId, alt });

  return res.status(200).type("application/json").send({ id: imageId });
});
