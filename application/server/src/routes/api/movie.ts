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
import { movies } from "@web-speed-hackathon-2026/server/src/db/schema";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const execFileAsync = promisify(execFile);
const EXTENSION = "mp4";

export const movieRouter = new Hono<SessionEnv>().post(
  "/movies",
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

    const movieId = uuidv4();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
    const inputPath = path.join(tmpDir, "input");
    const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

    try {
      await fs.writeFile(inputPath, buffer);

      // Convert to MP4: first 5 seconds, square crop, no audio
      await execFileAsync("ffmpeg", [
        "-i",
        inputPath,
        "-t",
        "5",
        "-vf",
        "crop='min(iw,ih)':'min(iw,ih)'",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-movflags",
        "+faststart",
        "-y",
        outputPath,
      ]);

      const mp4Buffer = await fs.readFile(outputPath);

      const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
      await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
      await fs.writeFile(filePath, mp4Buffer);
    } catch {
      throw new HTTPException(400, { message: "Invalid video file" });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    const now = new Date().toISOString();
    const db = getDb();
    db.insert(movies).values({ id: movieId, createdAt: now, updatedAt: now }).run();

    return c.json({ id: movieId });
  },
);
