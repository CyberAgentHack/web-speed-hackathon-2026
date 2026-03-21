import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

export const movieOptimizerRouter = Router();

movieOptimizerRouter.get("/movies/:id.mp4", async (req, res, next) => {
  const { id } = req.params;

  // Check if MP4 already exists (pre-converted or previously converted from GIF)
  const mp4Paths = [
    path.join(UPLOAD_PATH, "movies", `${id}.mp4`),
    path.join(PUBLIC_PATH, "movies", `${id}.mp4`),
  ];

  for (const mp4Path of mp4Paths) {
    try {
      const mp4Buffer = await fs.readFile(mp4Path) as Buffer;
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(mp4Buffer);
    } catch {
      continue;
    }
  }

  // Convert GIF to MP4 and persist to disk
  const gifPaths = [
    { gif: path.join(UPLOAD_PATH, "movies", `${id}.gif`), mp4: path.join(UPLOAD_PATH, "movies", `${id}.mp4`) },
    { gif: path.join(PUBLIC_PATH, "movies", `${id}.gif`), mp4: path.join(PUBLIC_PATH, "movies", `${id}.mp4`) },
  ];

  let gifPath: string | null = null;
  let mp4OutputPath: string | null = null;
  for (const { gif, mp4 } of gifPaths) {
    try {
      await fs.access(gif);
      gifPath = gif;
      mp4OutputPath = mp4;
      break;
    } catch {
      continue;
    }
  }

  if (!gifPath || !mp4OutputPath) {
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
    await fs.writeFile(mp4OutputPath, mp4Buffer);

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(mp4Buffer);
  } catch {
    return next();
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});
