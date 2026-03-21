import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

const EXTENSION = "mp4";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const movieId = uuidv4();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

  try {
    await fs.writeFile(inputPath, req.body);

    // Convert to MP4: first 5 seconds, square crop, 10fps, no audio
    await execFileAsync("ffmpeg", [
      "-i", inputPath,
      "-t", "5",
      "-r", "10",
      "-vf", "crop=min(iw\\,ih):min(iw\\,ih)",
      "-an",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-y",
      outputPath,
    ]);

    const outputBuffer = await fs.readFile(outputPath);

    const moviesDir = path.resolve(UPLOAD_PATH, "movies");
    await fs.mkdir(moviesDir, { recursive: true });
    await fs.writeFile(path.resolve(moviesDir, `${movieId}.${EXTENSION}`), outputBuffer);

    // Generate poster image from first frame
    const posterJpgPath = path.join(tmpDir, "poster.jpg");
    await execFileAsync("ffmpeg", [
      "-i", outputPath,
      "-vframes", "1",
      "-vf", "crop=min(iw\\,ih):min(iw\\,ih)",
      "-q:v", "2",
      "-update", "1",
      "-y",
      posterJpgPath,
    ]);
    await sharp(posterJpgPath)
      .resize(640, 640, { fit: "cover" })
      .webp({ quality: 60 })
      .toFile(path.resolve(moviesDir, `${movieId}_poster.webp`));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
