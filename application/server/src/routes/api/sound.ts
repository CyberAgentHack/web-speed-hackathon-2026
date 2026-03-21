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
import { sounds } from "@web-speed-hackathon-2026/server/src/db/schema";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execFileAsync = promisify(execFile);
const EXTENSION = "mp3";

export const soundRouter = new Hono<SessionEnv>().post(
  "/sounds",
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

    // Extract metadata from original file before conversion
    const { artist, title } = await extractMetadataFromSound(buffer);

    const soundId = uuidv4();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
    const inputPath = path.join(tmpDir, "input");
    const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

    try {
      await fs.writeFile(inputPath, buffer);

      // Convert to MP3 with metadata
      await execFileAsync("ffmpeg", [
        "-i",
        inputPath,
        "-vn",
        ...(artist ? ["-metadata", `artist=${artist}`] : []),
        ...(title ? ["-metadata", `title=${title}`] : []),
        "-y",
        outputPath,
      ]);

      const mp3Buffer = await fs.readFile(outputPath);

      const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
      await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
      await fs.writeFile(filePath, mp3Buffer);
    } catch {
      throw new HTTPException(400, { message: "Invalid audio file" });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    const now = new Date().toISOString();
    const db = getDb();
    db.insert(sounds)
      .values({
        id: soundId,
        title: title || "Unknown",
        artist: artist || "Unknown",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return c.json({ artist, id: soundId, title });
  },
);
