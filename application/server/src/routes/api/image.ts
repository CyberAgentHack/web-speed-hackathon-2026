import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "avif";

/**
 * TIFF IFD から ImageDescription (tag 0x010E) を探して返す。
 * JPEG 埋め込み EXIF ("Exif\0\0" 付き) も TIFF ファイル本体も両方処理できる。
 */
function readIfdImageDescription(buf: Buffer, dataStart: number): string {
  try {
    const data = buf.subarray(dataStart);
    if (data.length < 8) return "";
    const le = data.readUInt16BE(0) === 0x4949;
    const u16 = (off: number) => (le ? data.readUInt16LE(off) : data.readUInt16BE(off));
    const u32 = (off: number) => (le ? data.readUInt32LE(off) : data.readUInt32BE(off));
    if (u16(2) !== 42) return "";
    const ifd0Off = u32(4);
    if (ifd0Off + 2 > data.length) return "";
    const entryCount = u16(ifd0Off);
    for (let i = 0; i < entryCount; i++) {
      const off = ifd0Off + 2 + i * 12;
      if (off + 12 > data.length) break;
      if (u16(off) !== 0x010e) continue; // ImageDescription
      const count = u32(off + 4);
      if (count === 0) return "";
      const strOff = count <= 4 ? off + 8 : u32(off + 8);
      const strLen = Math.max(0, count - 1);
      if (strOff + strLen > data.length) return "";
      return new TextDecoder("utf-8").decode(data.subarray(strOff, strOff + strLen));
    }
  } catch {
    // 無視
  }
  return "";
}

/** JPEG 埋め込み EXIF (metadata.exif) から ImageDescription を抽出 */
function extractFromExifBuf(exifBuf: Buffer): string {
  // "Exif\0\0" の 6 バイトをスキップして TIFF IFD を読む
  return readIfdImageDescription(exifBuf, 6);
}

/** TIFF ファイル本体から直接 IFD0 の ImageDescription を抽出 */
function extractFromTiffBuf(buf: Buffer): string {
  return readIfdImageDescription(buf, 0);
}

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  let output: Buffer;
  let alt = "";
  try {
    const img = sharp(req.body);
    const { exif, format } = await img.metadata();
    if (exif) {
      alt = extractFromExifBuf(exif);
    }
    // TIFF は metadata.exif が null になるため、バッファを直接パース
    if (!alt && format === "tiff") {
      alt = extractFromTiffBuf(req.body as Buffer);
    }
    output = await img.withMetadata().avif({ quality: 30 }).toBuffer();
  } catch {
    throw new httpErrors.BadRequest("Invalid image file");
  }

  const imageId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, output);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
