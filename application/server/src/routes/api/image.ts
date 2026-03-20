import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "jpg";

export const imageRouter = Router();

/** EXIF バイナリから ImageDescription タグ (0x010E) を取得する */
function extractImageDescription(exifBuffer: Buffer): string {
  try {
    // EXIF ヘッダー "Exif\0\0" の後に TIFF データが続く
    if (exifBuffer.length < 8) return "";
    const tiff = exifBuffer.subarray(6);
    const little = tiff[0] === 0x49; // "II" = little endian
    const read16 = (o: number) => little ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o);
    const read32 = (o: number) => little ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o);

    const ifdOffset = read32(4);
    const entryCount = read16(ifdOffset);

    for (let i = 0; i < entryCount; i++) {
      const base = ifdOffset + 2 + i * 12;
      const tag = read16(base);
      if (tag !== 0x010e) continue; // ImageDescription

      const type = read16(base + 2);
      const count = read32(base + 4);
      const valueOrOffset = read32(base + 8);

      if (type !== 2) break; // ASCII のみ対応
      const offset = count <= 4 ? base + 8 : valueOrOffset;
      const raw = tiff.subarray(offset, offset + count - 1); // null terminator を除く
      return raw.toString("utf8");
    }
  } catch {
    // ignore
  }
  return "";
}

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // sharp で任意フォーマット (TIFF 含む) → JPG 変換、EXIF 保持
  let outputBuffer: Buffer;
  let exifBuffer: Buffer | undefined;
  try {
    const instance = sharp(req.body).jpeg({ quality: 85 }).withMetadata();
    const [buf, metadata] = await Promise.all([
      instance.toBuffer(),
      sharp(req.body).metadata(),
    ]);
    outputBuffer = buf;
    exifBuffer = metadata.exif;
  } catch {
    throw new httpErrors.BadRequest("Invalid image file");
  }

  // EXIF の ImageDescription を ALT テキストとして取得
  const alt = exifBuffer ? extractImageDescription(exifBuffer) : "";

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, outputBuffer);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
