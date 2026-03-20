import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "jpg";

/**
 * JPEG バイナリから EXIF ImageDescription (tag 0x010E) を抽出する
 */
function extractExifDescription(buf: Buffer): string {
  // APP1 マーカー (0xFFE1) を探す
  const app1 = buf.indexOf(Buffer.from([0xff, 0xe1]));
  if (app1 < 0) return "";

  const exifStart = app1 + 2 + 2 + 6; // marker + length + "Exif\0\0"
  if (exifStart + 8 > buf.length) return "";

  const be = buf[exifStart] === 0x4d; // 'M' = big-endian
  const readU16 = be
    ? (o: number) => buf.readUInt16BE(exifStart + o)
    : (o: number) => buf.readUInt16LE(exifStart + o);
  const readU32 = be
    ? (o: number) => buf.readUInt32BE(exifStart + o)
    : (o: number) => buf.readUInt32LE(exifStart + o);

  const ifdOffset = readU32(4);
  const numEntries = readU16(ifdOffset);

  for (let i = 0; i < numEntries; i++) {
    const entryPos = ifdOffset + 2 + i * 12;
    const tag = readU16(entryPos);
    if (tag === 0x010e) {
      const count = readU32(entryPos + 4);
      const valOffset = count <= 4 ? entryPos + 8 : readU32(entryPos + 8);
      const raw = buf.subarray(exifStart + valOffset, exifStart + valOffset + count);
      return raw.toString("utf-8").replace(/\0+$/, "");
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

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();
  const alt = extractExifDescription(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
