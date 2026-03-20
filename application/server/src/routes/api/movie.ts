import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

// 変換した動画の拡張子
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
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${movieId}_input`);
  const outputPath = path.join(tmpDir, `${movieId}.${EXTENSION}`);

  try {
    await fs.writeFile(inputPath, req.body);

    await execFileAsync("ffmpeg", [
      "-i", inputPath,
      "-y",
      "-t", "5",
      "-vf", "crop=min(iw\\,ih):min(iw\\,ih),scale=320:320,fps=10",
      "-vcodec", "libx264",
      "-pix_fmt", "yuv420p",
      "-crf", "28",
      "-movflags", "+faststart",
      "-an",
      outputPath,
    ]);

    const outputBuffer = await fs.readFile(outputPath);

    const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
    await fs.writeFile(filePath, outputBuffer);

    return res.status(200).type("application/json").send({ id: movieId });
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
});
