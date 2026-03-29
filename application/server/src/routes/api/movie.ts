import { promises as fs } from "fs";
import { promisify } from "util";
import path from "path";
import { execFile } from "child_process";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const ALLOWED_EXTENSIONS = new Set(["gif", "mp4", "webm"]);
const execFileAsync = promisify(execFile);

async function writePosterFrame(moviePath: string, posterPath: string) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    moviePath,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    posterPath,
  ]);
}

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ALLOWED_EXTENSIONS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${type.ext}`);
  const posterPath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.jpg`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, req.body);
  if (type.ext === "mp4" || type.ext === "webm") {
    try {
      await writePosterFrame(filePath, posterPath);
    } catch {
      // poster generation is optional; keep upload successful even if ffmpeg is unavailable
    }
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
