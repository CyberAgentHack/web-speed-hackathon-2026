import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した画像の拡張子
const EXTENSION = "webp";
// const EXTENSION = "jpg";
const TIFF_EXTENSIONS = new Set(["tif"]);
const TIFF_IMAGE_DESCRIPTION_TAG = 0x010e;
const TIFF_TYPE_ASCII = 2;

export const imageRouter = Router();

function readTiffUInt16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function readTiffUInt32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

function decodeTiffAscii(bytes: Uint8Array): string {
  const endIndex = bytes.indexOf(0);
  const trimmedBytes = endIndex === -1 ? bytes : bytes.subarray(0, endIndex);
  return new TextDecoder().decode(trimmedBytes).trim();
}

function extractTiffImageDescription(buffer: Uint8Array): string | null {
  if (buffer.length < 8) {
    return null;
  }

  const byteOrder = String.fromCharCode(buffer[0] ?? 0, buffer[1] ?? 0);
  const littleEndian = byteOrder === "II";
  const bigEndian = byteOrder === "MM";
  if (!littleEndian && !bigEndian) {
    return null;
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const magic = readTiffUInt16(view, 2, littleEndian);
  if (magic !== 42) {
    return null;
  }

  const ifdOffset = readTiffUInt32(view, 4, littleEndian);
  if (ifdOffset + 2 > buffer.length) {
    return null;
  }

  const entryCount = readTiffUInt16(view, ifdOffset, littleEndian);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > buffer.length) {
      return null;
    }

    const tag = readTiffUInt16(view, entryOffset, littleEndian);
    if (tag !== TIFF_IMAGE_DESCRIPTION_TAG) {
      continue;
    }

    const type = readTiffUInt16(view, entryOffset + 2, littleEndian);
    const count = readTiffUInt32(view, entryOffset + 4, littleEndian);
    if (type !== TIFF_TYPE_ASCII || count === 0) {
      return null;
    }

    let valueBytes: Uint8Array;
    if (count <= 4) {
      valueBytes = buffer.subarray(entryOffset + 8, entryOffset + 8 + count);
    } else {
      const valueOffset = readTiffUInt32(view, entryOffset + 8, littleEndian);
      if (valueOffset + count > buffer.length) {
        return null;
      }
      valueBytes = buffer.subarray(valueOffset, valueOffset + count);
    }

    const description = decodeTiffAscii(valueBytes);
    return description === "" ? null : description;
  }

  return null;
}

async function convertTiffToWebp(buffer: Buffer): Promise<Buffer> {
  const importModule = new Function("specifier", "return import(specifier);") as (
    specifier: string,
  ) => Promise<{ default: (input?: Buffer, options?: { pages?: number }) => { rotate: () => { webp: () => { toBuffer: () => Promise<Buffer> } } } }>;

  const { default: sharp } = await importModule("sharp");
  return sharp(buffer, { pages: 1 }).rotate().webp().toBuffer();
}

async function normalizeImageBuffer(buffer: Buffer): Promise<Buffer> {
  const type = await fileTypeFromBuffer(buffer);
  if (type === undefined) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  if (type.ext === EXTENSION) {
    return buffer;
  }

  if (TIFF_EXTENSIONS.has(type.ext)) {
    return convertTiffToWebp(buffer);
  }

  throw new httpErrors.BadRequest("Invalid file type");
}

async function extractImageAlt(buffer: Buffer): Promise<string> {
  const type = await fileTypeFromBuffer(buffer);
  if (type === undefined) {
    return "";
  }

  if (TIFF_EXTENSIONS.has(type.ext)) {
    return extractTiffImageDescription(new Uint8Array(buffer)) ?? "";
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

  const [normalizedBuffer, alt] = await Promise.all([
    normalizeImageBuffer(req.body),
    extractImageAlt(req.body),
  ]);

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, normalizedBuffer);

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
