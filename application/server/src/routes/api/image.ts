import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// クライアントはJPGで送信、サーバーは .webp 拡張子で保存（getImagePathとの整合）
const SAVE_EXTENSION = "webp";

/**
 * 画像バッファから EXIF の ImageDescription (tag 0x010E) を抽出する
 * sharp を使うことで JPEG / TIFF 等フォーマットを問わず対応
 */
async function extractImageDescription(buffer: Buffer): Promise<string | null> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.exif) return null;

  const exifBuf = metadata.exif;

  // sharp の metadata().exif は "Exif\0\0" ヘッダー付きの場合があるのでスキップ
  let tiffStart = 0;
  if (exifBuf.length > 6 && exifBuf.subarray(0, 4).toString("ascii") === "Exif") {
    tiffStart = 6;
  }

  // TIFF ヘッダー: byte order (II=LE / MM=BE), magic 42, IFD0 offset
  const byteOrder = exifBuf.readUInt16BE(tiffStart);
  const isLE = byteOrder === 0x4949;

  const readU16 = (o: number) => (isLE ? exifBuf.readUInt16LE(o) : exifBuf.readUInt16BE(o));
  const readU32 = (o: number) => (isLE ? exifBuf.readUInt32LE(o) : exifBuf.readUInt32BE(o));

  const ifdOffset = readU32(tiffStart + 4);
  const ifdStart = tiffStart + ifdOffset;
  const entryCount = readU16(ifdStart);

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdStart + 2 + i * 12;
    const tag = readU16(entryOffset);
    if (tag === 0x010e) {
      // ImageDescription
      const count = readU32(entryOffset + 4);
      const valueOffset = count <= 4 ? entryOffset + 8 : tiffStart + readU32(entryOffset + 8);
      const raw = exifBuf.subarray(valueOffset, valueOffset + count);
      const text = Buffer.from(raw).toString("utf-8").replace(/\0+$/, "");
      return text || null;
    }
  }
  return null;
}

const ALT_TEXTS_PATH = path.resolve(PUBLIC_PATH, "images/alt_texts.json");

async function addAltText(imageId: string, altText: string): Promise<void> {
  let altTexts: Record<string, string> = {};
  try {
    const content = await fs.readFile(ALT_TEXTS_PATH, "utf-8");
    altTexts = JSON.parse(content);
  } catch {
    // ファイルが無い場合は空オブジェクトで開始
  }
  altTexts[imageId] = altText;
  await fs.writeFile(ALT_TEXTS_PATH, JSON.stringify(altTexts), "utf-8");
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
  if (type === undefined || type.ext !== "jpg") {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${SAVE_EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  const webpBuffer = await sharp(req.body).webp({ quality: 80 }).toBuffer();
  await fs.writeFile(filePath, webpBuffer);

  // 元のJPGも保存（E2Eテスト等で元フォーマットを参照するケースに対応）
  const jpgPath = path.resolve(UPLOAD_PATH, `./images/${imageId}.jpg`);
  await fs.writeFile(jpgPath, req.body);

  // EXIF の ImageDescription を抽出して alt_texts.json に追記
  const altText = await extractImageDescription(req.body);
  if (altText) {
    await addAltText(imageId, altText);
  }

  return res.status(200).type("application/json").send({ id: imageId, alt: altText ?? "" });
});
