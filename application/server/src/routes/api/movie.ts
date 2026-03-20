import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
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

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== "gif") {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const moviesDir = path.resolve(UPLOAD_PATH, "movies");
  const gifPath = path.resolve(moviesDir, `${movieId}.gif`);
  const webmPath = path.resolve(moviesDir, `${movieId}.webm`);

  await fs.mkdir(moviesDir, { recursive: true });
  await fs.writeFile(gifPath, req.body);

  await execFileAsync("ffmpeg", [
    "-y", "-i", gifPath,
    "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "33", "-an",
    "-deadline", "realtime", "-cpu-used", "8",
    webmPath,
  ]);

  await fs.unlink(gifPath);

  return res.status(200).type("application/json").send({ id: movieId });
});
