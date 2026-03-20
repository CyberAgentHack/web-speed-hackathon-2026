import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const execFileAsync = promisify(execFile);
const EXTENSION = "gif";

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

      // Convert to GIF: first 5 seconds, 10fps, square crop, no audio
      await execFileAsync("ffmpeg", [
        "-i",
        inputPath,
        "-t",
        "5",
        "-r",
        "10",
        "-vf",
        "crop='min(iw,ih)':'min(iw,ih)'",
        "-an",
        "-y",
        outputPath,
      ]);

      const gifBuffer = await fs.readFile(outputPath);

      const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
      await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
      await fs.writeFile(filePath, gifBuffer);
    } catch {
      throw new HTTPException(400, { message: "Invalid video file" });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    return c.json({ id: movieId });
  },
);
