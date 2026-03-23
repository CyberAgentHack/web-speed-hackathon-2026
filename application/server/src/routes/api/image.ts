import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "avif";

/**
 * TIFF IFD から ImageDescription タグ (0x010E) を取得する。
 * TIFF ファイルの raw buffer および JPEG EXIF 内の TIFF IFD の両方に対応。
 */
function parseExifAlt(buf: Buffer): string {
  if (buf.length < 8) return "";
  const le = buf[0] === 0x49; // 'I' = little-endian, 'M' = big-endian
  const magic = le ? buf.readUInt16LE(2) : buf.readUInt16BE(2);
  if (magic !== 0x002a) return "";
  const ifd0Offset = le ? buf.readUInt32LE(4) : buf.readUInt32BE(4);
  if (ifd0Offset + 2 > buf.length) return "";
  const entryCount = le ? buf.readUInt16LE(ifd0Offset) : buf.readUInt16BE(ifd0Offset);
  for (let i = 0; i < entryCount; i++) {
    const base = ifd0Offset + 2 + i * 12;
    if (base + 12 > buf.length) break;
    const tag = le ? buf.readUInt16LE(base) : buf.readUInt16BE(base);
    if (tag !== 0x010e) continue;
    const type = le ? buf.readUInt16LE(base + 2) : buf.readUInt16BE(base + 2);
    if (type !== 2) break; // ASCII のみ
    const count = le ? buf.readUInt32LE(base + 4) : buf.readUInt32BE(base + 4);
    if (count === 0) break;
    const valueOffset = count <= 4 ? base + 8 : (le ? buf.readUInt32LE(base + 8) : buf.readUInt32BE(base + 8));
    if (valueOffset + count > buf.length) break;
    return buf.toString("utf8", valueOffset, valueOffset + count - 1);
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

  // TIFF raw buffer を直接解析（metadata().exif では TIFF メイン IFD が取れないため）
  // JPEG の場合は metadata.exif 経由でフォールバック（"Exif\0\0" 6バイトプレフィックスをスキップ）
  const body = req.body as Buffer;
  let alt = parseExifAlt(body);
  if (!alt) {
    const metadata = await sharp(body).metadata();
    if (metadata.exif) {
      // sharp が返す exif バッファは "Exif\0\0" (0x45...) で始まるため 6 バイトスキップ
      const exifBuf = metadata.exif[0] === 0x45 ? metadata.exif.slice(6) : metadata.exif;
      alt = parseExifAlt(exifBuf);
    }
  }

  const converted = await sharp(body)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .avif({ quality: 60 })
    .toBuffer();

  const imageId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, converted);

  await Image.create({ id: imageId, alt });

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
