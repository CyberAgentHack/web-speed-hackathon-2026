import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models/Image";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "jpg";

function extractExifAlt(buf: Buffer): string {
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
      const readU16 = (pos: number) => (isBE ? exifData.readUInt16BE(pos) : exifData.readUInt16LE(pos));
      const readU32 = (pos: number) => (isBE ? exifData.readUInt32BE(pos) : exifData.readUInt32LE(pos));
      const ifdOffset = readU32(tiffStart + 4);
      const numEntries = readU16(tiffStart + ifdOffset);
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
        if (readU16(entryOffset) === 0x010e) {
          const count = readU32(entryOffset + 4);
          const valueOffset = count <= 4 ? entryOffset + 8 : tiffStart + readU32(entryOffset + 8);
          return exifData.subarray(valueOffset, valueOffset + count).toString("utf-8").replace(/\0$/, "");
        }
      }
      break;
    }
    offset += 2 + segLen;
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

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  const alt = extractExifAlt(req.body as Buffer);
  await Image.create({ id: imageId, alt });

  return res.status(200).type("application/json").send({ id: imageId });
});
