import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";

import { getDb } from "@web-speed-hackathon-2026/server/src/db";
import { images } from "@web-speed-hackathon-2026/server/src/db/schema";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const execFileAsync = promisify(execFile);
const EXTENSION = "jpg";

/** Parse TIFF IFD to extract ImageDescription tag (0x010e). */
function extractTiffDescription(buf: Buffer): string {
  if (buf.length < 8) return "";
  const magic = buf.readUInt16BE(0);
  const isBE = magic === 0x4d4d; // MM = big-endian
  const isLE = magic === 0x4949; // II = little-endian
  if (!isBE && !isLE) return "";
  const r16 = isLE ? (o: number) => buf.readUInt16LE(o) : (o: number) => buf.readUInt16BE(o);
  const r32 = isLE ? (o: number) => buf.readUInt32LE(o) : (o: number) => buf.readUInt32BE(o);
  const ifdOffset = r32(4);
  if (ifdOffset + 2 > buf.length) return "";
  const n = r16(ifdOffset);
  for (let i = 0; i < n; i++) {
    const off = ifdOffset + 2 + i * 12;
    if (off + 12 > buf.length) break;
    if (r16(off) === 0x010e) {
      const count = r32(off + 4);
      const valOff = count <= 4 ? off + 8 : r32(off + 8);
      if (valOff + count > buf.length) return "";
      return buf.toString("utf8", valOff, valOff + count).replace(/\0+$/, "");
    }
  }
  return "";
}

export const imageRouter = new Hono<SessionEnv>().post(
  "/images",
  bodyLimit({ maxSize: 10 * 1024 * 1024 }),
  async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const buffer = Buffer.from(await c.req.arrayBuffer());
    if (buffer.length === 0) {
      throw new HTTPException(400);
    }

    const imageId = uuidv4();
    const now = new Date().toISOString();

    // Alt text: prefer query parameter (from client-side extraction), fallback to TIFF IFD
    let alt = c.req.query("alt") || "";
    if (!alt) {
      try {
        alt = extractTiffDescription(buffer);
      } catch {
        // metadata extraction failure is non-fatal
      }
    }

    // Convert any image format to JPEG using ffmpeg (avoids sharp native module crash on Bun)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "image-"));
    const inputPath = path.join(tmpDir, "input");
    const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

    try {
      await fs.writeFile(inputPath, buffer);
      await execFileAsync("ffmpeg", ["-i", inputPath, "-q:v", "2", "-y", outputPath]);
      const jpegBuffer = await fs.readFile(outputPath);

      const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
      await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
      await fs.writeFile(filePath, jpegBuffer);
    } catch {
      throw new HTTPException(400, { message: "Invalid image file" });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    // Insert image record into database
    const db = getDb();
    db.insert(images).values({ id: imageId, alt, createdAt: now, updatedAt: now }).run();

    return c.json({ id: imageId });
  },
);
