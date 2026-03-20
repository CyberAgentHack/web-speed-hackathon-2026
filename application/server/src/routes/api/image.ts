import { promises as fs } from "fs";
import path from "path";

import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const EXTENSION = "jpg";

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

    // Convert any image format to JPEG using sharp, preserving EXIF metadata
    let jpegBuffer: Buffer;
    try {
      jpegBuffer = await sharp(buffer).keepExif().jpeg().toBuffer();
    } catch {
      throw new HTTPException(400, { message: "Invalid image file" });
    }

    const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
    await fs.writeFile(filePath, jpegBuffer);

    return c.json({ id: imageId });
  },
);
