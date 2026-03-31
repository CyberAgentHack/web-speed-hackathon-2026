import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "jpg";

/**
 * TIFF/JPEG バイナリの IFD0 から ImageDescription タグ（0x010E）を抽出する。
 * TIFF は先頭が直接 IFD ヘッダ、JPEG EXIF は "Exif\0\0" + IFD ヘッダ。
 */
function extractImageDescription(buf: Buffer): string {
  try {
    let offset = 0;
    // JPEG EXIF の "Exif\0\0" ヘッダをスキップ
    if (buf.length > 6 && buf.subarray(0, 4).toString("ascii") === "Exif") {
      offset = 6;
    }
    const isLE = buf.readUInt16BE(offset) === 0x4949; // "II" = little endian
    const r16 = (p: number) => (isLE ? buf.readUInt16LE(p) : buf.readUInt16BE(p));
    const r32 = (p: number) => (isLE ? buf.readUInt32LE(p) : buf.readUInt32BE(p));

    // TIFF magic number チェック (42)
    if (r16(offset + 2) !== 42) return "";

    const ifd0 = offset + r32(offset + 4);
    const count = r16(ifd0);
    for (let i = 0; i < count; i++) {
      const e = ifd0 + 2 + i * 12;
      if (r16(e) !== 0x010e) continue; // ImageDescription
      const byteCount = r32(e + 4);
      const start = byteCount <= 4 ? e + 8 : offset + r32(e + 8);
      return buf.subarray(start, start + byteCount - 1).toString("utf8");
    }
  } catch {}
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

  // 元の入力バイナリから ImageDescription を抽出（TIFF の場合 IFD0 に直接含まれる）
  const alt = extractImageDescription(req.body as Buffer);

  // サーバーサイドでJPEGに変換（クライアントWASM不要）
  const converted = await sharp(req.body).jpeg().withMetadata().toBuffer();

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
