import { spawn } from "node:child_process";
import { Hono } from "hono";
import type { Context } from "hono";
import { fileTypeFromBuffer } from "file-type";
import { promises as fs } from "fs";
import path from "path";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const OUTPUT_EXTENSION = "mp4";
const ACCEPTED_VIDEO_MIME_PREFIX = "video/";

function runFFmpeg(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-t",
        "5",
        "-an",
        "-vf",
        "crop='floor(min(iw,ih)/2)*2':'floor(min(iw,ih)/2)*2',scale=480:480:flags=lanczos,fps=10,format=yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      {
        stdio: ["ignore", "ignore", "pipe"],
      },
    );

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `ffmpeg exited with code ${code ?? "unknown"}`));
    });
  });
}

export const movieRouter = new Hono();

movieRouter.post("/movies", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  if (session["userId"] === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const rawBody = c.get("rawBody" as never) as Buffer | undefined;
  if (!rawBody) {
    return c.json({ message: "Bad Request" }, 400);
  }

  const type = await fileTypeFromBuffer(rawBody);
  if (type === undefined || !type.mime.startsWith(ACCEPTED_VIDEO_MIME_PREFIX)) {
    return c.json({ message: "Invalid file type" }, 400);
  }

  const movieId = crypto.randomUUID();
  const inputFileId = crypto.randomUUID();
  const moviesDirectoryPath = path.resolve(UPLOAD_PATH, "movies");
  const tempDirectoryPath = path.resolve(UPLOAD_PATH, ".tmp");
  const inputPath = path.resolve(tempDirectoryPath, `${inputFileId}.${type.ext}`);
  const outputPath = path.resolve(moviesDirectoryPath, `${movieId}.${OUTPUT_EXTENSION}`);

  await fs.mkdir(moviesDirectoryPath, { recursive: true });
  await fs.mkdir(tempDirectoryPath, { recursive: true });
  await fs.writeFile(inputPath, rawBody);

  try {
    await runFFmpeg(inputPath, outputPath);
  } finally {
    await fs.rm(inputPath, { force: true });
  }

  return c.json({ id: movieId }, 200);
});
