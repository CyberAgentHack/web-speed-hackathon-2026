import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

export const movieOptimizerRouter = Router();

const cache = new Map<string, Buffer>();

movieOptimizerRouter.get("/movies/:id.mp4", async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `movie:${id}:mp4`;

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(cached);
  }

  // Check if MP4 already exists (pre-converted)
  const mp4Paths = [
    path.join(UPLOAD_PATH, "movies", `${id}.mp4`),
    path.join(PUBLIC_PATH, "movies", `${id}.mp4`),
  ];

  for (const mp4Path of mp4Paths) {
    try {
      const mp4Buffer = await fs.readFile(mp4Path) as Buffer;
      cache.set(cacheKey, mp4Buffer);
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(mp4Buffer);
    } catch {
      continue;
    }
  }

  // Convert GIF to MP4 on-the-fly (for uploaded movies)
  const gifPaths = [
    path.join(UPLOAD_PATH, "movies", `${id}.gif`),
    path.join(PUBLIC_PATH, "movies", `${id}.gif`),
  ];

  let gifPath: string | null = null;
  for (const filePath of gifPaths) {
    try {
      await fs.access(filePath);
      gifPath = filePath;
      break;
    } catch {
      continue;
    }
  }

  if (!gifPath) {
    return next();
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-opt-"));
  const tmpOutput = path.join(tmpDir, "output.mp4");

  try {
    await execFileAsync("ffmpeg", [
      "-i", gifPath,
      "-y",
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "28",
      "-an",
      tmpOutput,
    ]);

    const mp4Buffer = await fs.readFile(tmpOutput) as Buffer;
    cache.set(cacheKey, mp4Buffer);

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(mp4Buffer);
  } catch {
    return next();
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});
