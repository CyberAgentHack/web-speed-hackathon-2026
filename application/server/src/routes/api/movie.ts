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

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const inputBuffer = req.body as Buffer;
  const movieId = uuidv4();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const tmpInput = path.join(tmpDir, "input");
  const tmpOutput = path.join(tmpDir, "output.mp4");

  try {
    await fs.writeFile(tmpInput, inputBuffer);

    await execFileAsync("ffmpeg", [
      "-i", tmpInput,
      "-y",
      "-t", "5",
      "-r", "10",
      "-vf", "crop='min(iw,ih)':'min(iw,ih)',scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "28",
      "-an",
      tmpOutput,
    ]);

    const mp4Buffer = await fs.readFile(tmpOutput);

    const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.mp4`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
    await fs.writeFile(filePath, mp4Buffer);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
