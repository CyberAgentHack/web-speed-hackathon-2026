import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "avif";

/** TIFF IFD 形式の EXIF バッファから ImageDescription タグ (0x010E) を取得する */
function parseExifAlt(exif: Buffer): string {
  if (exif.length < 8) return "";
  const le = exif[0] === 0x49; // 'I' = little-endian
  const magic = le ? exif.readUInt16LE(2) : exif.readUInt16BE(2);
  if (magic !== 0x002a) return "";
  const ifd0Offset = le ? exif.readUInt32LE(4) : exif.readUInt32BE(4);
  if (ifd0Offset + 2 > exif.length) return "";
  const entryCount = le ? exif.readUInt16LE(ifd0Offset) : exif.readUInt16BE(ifd0Offset);
  for (let i = 0; i < entryCount; i++) {
    const base = ifd0Offset + 2 + i * 12;
    if (base + 12 > exif.length) break;
    const tag = le ? exif.readUInt16LE(base) : exif.readUInt16BE(base);
    if (tag !== 0x010e) continue; // ImageDescription
    const type = le ? exif.readUInt16LE(base + 2) : exif.readUInt16BE(base + 2);
    if (type !== 2) break; // ASCII のみ
    const count = le ? exif.readUInt32LE(base + 4) : exif.readUInt32BE(base + 4);
    if (count === 0) break;
    const valueOffset = count <= 4 ? base + 8 : (le ? exif.readUInt32LE(base + 8) : exif.readUInt32BE(base + 8));
    if (valueOffset + count > exif.length) break;
    return exif.toString("utf8", valueOffset, valueOffset + count - 1);
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

  const image = sharp(req.body);
  const metadata = await image.metadata();
  const alt = metadata.exif ? parseExifAlt(metadata.exif) : "";

  const converted = await image
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .avif({ quality: 60 })
    .toBuffer();

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
