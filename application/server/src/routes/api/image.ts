import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "jpg";

const IMAGE_DESCRIPTION_TAG = 0x010e;
const EXIF_HEADER = "Exif\0\0";

function getReader(buffer: Buffer, isLittleEndian: boolean) {
  return {
    readUInt16(offset: number) {
      return isLittleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
    },
    readUInt32(offset: number) {
      return isLittleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
    },
  };
}

function extractExifImageDescription(buffer: Buffer): string {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return "";
  }

  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    const dataStart = offset + 4;
    const dataEnd = offset + 2 + segmentLength;
    if (dataEnd > buffer.length) {
      break;
    }

    if (
      marker === 0xe1 &&
      buffer.toString("binary", dataStart, dataStart + EXIF_HEADER.length) === EXIF_HEADER
    ) {
      const tiffStart = dataStart + EXIF_HEADER.length;
      const byteOrder = buffer.toString("ascii", tiffStart, tiffStart + 2);
      const isLittleEndian = byteOrder === "II";
      if (!isLittleEndian && byteOrder !== "MM") {
        return "";
      }

      const reader = getReader(buffer, isLittleEndian);
      const firstIfdOffset = reader.readUInt32(tiffStart + 4);
      const ifdStart = tiffStart + firstIfdOffset;
      if (ifdStart + 2 > buffer.length) {
        return "";
      }

      const entryCount = reader.readUInt16(ifdStart);
      for (let index = 0; index < entryCount; index += 1) {
        const entryOffset = ifdStart + 2 + index * 12;
        if (entryOffset + 12 > buffer.length) {
          return "";
        }

        const tag = reader.readUInt16(entryOffset);
        if (tag !== IMAGE_DESCRIPTION_TAG) {
          continue;
        }

        const valueLength = reader.readUInt32(entryOffset + 4);
        if (valueLength === 0) {
          return "";
        }

        let valueStart = entryOffset + 8;
        if (valueLength > 4) {
          valueStart = tiffStart + reader.readUInt32(entryOffset + 8);
        }

        const valueEnd = valueStart + valueLength;
        if (valueStart < 0 || valueEnd > buffer.length) {
          return "";
        }

        return new TextDecoder()
          .decode(buffer.subarray(valueStart, valueEnd))
          .replace(/\0+$/g, "")
          .trim();
      }
    }

    offset = dataEnd;
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
  const alt = extractExifImageDescription(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
