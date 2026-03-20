import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "jpg";

function extractExifDescription(buffer: Buffer): string {
  try {
    const EXIF_MARKER = 0xffe1;
    const IMAGE_DESCRIPTION_TAG = 0x010e;

    let offset = 2;
    while (offset < buffer.length - 2) {
      const marker = buffer.readUInt16BE(offset);
      if (marker === EXIF_MARKER) {
        const segLen = buffer.readUInt16BE(offset + 2);
        const exifHeader = buffer.toString("ascii", offset + 4, offset + 10);
        if (exifHeader === "Exif\0\0") {
          const tiffOffset = offset + 10;
          const byteOrder = buffer.readUInt16BE(tiffOffset);
          const isLittleEndian = byteOrder === 0x4949;

          const readU16 = (o: number) =>
            isLittleEndian ? buffer.readUInt16LE(o) : buffer.readUInt16BE(o);
          const readU32 = (o: number) =>
            isLittleEndian ? buffer.readUInt32LE(o) : buffer.readUInt32BE(o);

          const ifdOffset = readU32(tiffOffset + 4);
          const ifdStart = tiffOffset + ifdOffset;
          const entryCount = readU16(ifdStart);

          for (let i = 0; i < entryCount; i++) {
            const entryOffset = ifdStart + 2 + i * 12;
            const tag = readU16(entryOffset);
            if (tag === IMAGE_DESCRIPTION_TAG) {
              const count = readU32(entryOffset + 4);
              let valueOffset: number;
              if (count <= 4) {
                valueOffset = entryOffset + 8;
              } else {
                valueOffset = tiffOffset + readU32(entryOffset + 8);
              }
              const raw = buffer.subarray(valueOffset, valueOffset + count);
              const end = raw.indexOf(0);
              return raw.subarray(0, end === -1 ? count : end).toString("utf-8");
            }
          }
        }
        offset += 2 + segLen;
      } else if ((marker & 0xff00) === 0xff00) {
        const segLen = buffer.readUInt16BE(offset + 2);
        offset += 2 + segLen;
      } else {
        break;
      }
    }
  } catch {
    // ignore parse errors
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

  const inputBuffer = req.body as Buffer;

  // Extract EXIF description from original before conversion
  const alt = extractExifDescription(inputBuffer);

  // Convert any image format to JPEG using sharp
  const jpegBuffer = await sharp(inputBuffer)
    .jpeg({ quality: 80 })
    .toBuffer();

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, jpegBuffer);

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
