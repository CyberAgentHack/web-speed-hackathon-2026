import { execFile } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

// 変換した動画の拡張子
const EXTENSION = "webm";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const inputPath = path.resolve(tmpdir(), uuidv4());
  const movieId = uuidv4();
  const outputPath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(inputPath, req.body);

  try {
    await execFileAsync("ffmpeg", [
      "-i", inputPath,
      "-t", "5",
      "-r", "10",
      "-vf", "crop=min(iw,ih):min(iw,ih)",
      "-c:v", "libvpx",
      "-b:v", "500k",
      "-an",
      outputPath,
    ]);
  } catch {
    throw new httpErrors.BadRequest("Invalid video file");
  } finally {
    await fs.unlink(inputPath).catch(() => {});
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
