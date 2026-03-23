import { promises as fs } from "fs";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { getSession } from "@web-speed-hackathon-2026/server/src/session";

// 変換した画像の拡張子
const EXTENSION = "jpg";

export const imageRouter = new Hono();

async function extractAlt(buffer: Buffer): Promise<string> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.exif) return "";
    const exif = metadata.exif;
    const EXIF_HEADER = 6;
    if (exif.length < EXIF_HEADER + 8) return "";

    const littleEndian = exif[EXIF_HEADER] === 0x49;
    const readUint16 = (offset: number) =>
      littleEndian ? exif.readUInt16LE(offset) : exif.readUInt16BE(offset);
    const readUint32 = (offset: number) =>
      littleEndian ? exif.readUInt32LE(offset) : exif.readUInt32BE(offset);

    const ifdOffset = readUint32(EXIF_HEADER + 4) + EXIF_HEADER;
    if (ifdOffset + 2 > exif.length) return "";

    const numEntries = readUint16(ifdOffset);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      if (entryOffset + 12 > exif.length) break;
      const tag = readUint16(entryOffset);
      if (tag === 0x010e) {
        const type = readUint16(entryOffset + 2);
        const count = readUint32(entryOffset + 4);
        if (type !== 2) return "";
        const valueOrOffset = entryOffset + 8;
        let dataOffset: number;
        if (count <= 4) {
          dataOffset = valueOrOffset;
        } else {
          dataOffset = readUint32(valueOrOffset) + EXIF_HEADER;
        }
        if (dataOffset + count > exif.length) return "";
        const raw = exif.subarray(dataOffset, dataOffset + count - 1);
        return Buffer.from(raw).toString("utf8");
      }
    }
    return "";
  } catch {
    return "";
  }
}

imageRouter.post("/images", async (c) => {
  const userId = getSession(c);
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  const arrayBuffer = await c.req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new HTTPException(400);
  }

  const type = await fileTypeFromBuffer(buffer);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new HTTPException(400, { message: "Invalid file type" });
  }

  const imageId = uuidv4();
  const imagesDir = path.resolve(UPLOAD_PATH, "images");
  await fs.mkdir(imagesDir, { recursive: true });

  const filePath = path.resolve(imagesDir, `${imageId}.${EXTENSION}`);
  await fs.writeFile(filePath, buffer);

  const alt = await extractAlt(buffer);

  try {
    const sharpInstance = sharp(buffer);
    await Promise.all([
      sharpInstance
        .clone()
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.resolve(imagesDir, `${imageId}-400.webp`)),
      sharpInstance
        .clone()
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.resolve(imagesDir, `${imageId}-800.webp`)),
    ]);
  } catch {
    // WebP generation is optional; do not fail the request
  }

  return c.json({ alt, id: imageId });
});
