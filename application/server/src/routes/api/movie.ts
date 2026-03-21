import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { Router } from "express";
import httpErrors from "http-errors";
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
  const outputPath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(inputPath, req.body);

  try {
    await execFileAsync(ffmpegPath.path, [
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
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
