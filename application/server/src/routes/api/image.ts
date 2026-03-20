import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

// 変換した画像の拡張子
const EXTENSION = "jpg";

// TIFFファイルからImageDescription (Tag 270) を抽出する
function extractTiffDescription(buf: Buffer): string {
  if (buf.length < 8) return "";
  const sig = buf.readUInt16BE(0);
  const le = sig === 0x4949; // 'II' = little-endian
  const read16 = le ? (b: Buffer, o: number) => b.readUInt16LE(o) : (b: Buffer, o: number) => b.readUInt16BE(o);
  const read32 = le ? (b: Buffer, o: number) => b.readUInt32LE(o) : (b: Buffer, o: number) => b.readUInt32BE(o);

  try {
    const ifdOffset = read32(buf, 4);
    const numEntries = read16(buf, ifdOffset);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      const tag = read16(buf, entryOffset);
      if (tag === 270) { // ImageDescription
        const count = read32(buf, entryOffset + 4);
        const valueOffset = read32(buf, entryOffset + 8);
        return buf.toString("utf-8", valueOffset, valueOffset + count - 1);
      }
    }
  } catch {
    // メタデータ読み取り失敗は無視
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
  if (type === undefined || !type.mime.startsWith("image/")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  // TIFFの場合はメタデータからalt抽出
  const alt = type.ext === "tif" ? extractTiffDescription(req.body) : "";

  const imageId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });

  if (type.ext !== EXTENSION) {
    const tmpPath = path.resolve(UPLOAD_PATH, `./images/${imageId}_tmp.${type.ext}`);
    await fs.writeFile(tmpPath, req.body);
    await execFileAsync("ffmpeg", ["-y", "-i", tmpPath, filePath]);
    await fs.unlink(tmpPath);
  } else {
    await fs.writeFile(filePath, req.body);
  }

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
