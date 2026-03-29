import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import ffmpegPath from "ffmpeg-static";
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

  const movieId = uuidv4();
  const tmpIn = path.join(os.tmpdir(), `${movieId}_in`);
  const tmpOut = path.join(os.tmpdir(), `${movieId}.webm`);

  await fs.writeFile(tmpIn, req.body);
  try {
    await execFileAsync(ffmpegPath!, [
      "-i", tmpIn,
      "-t", "5",
      "-r", "10",
      "-vf", "crop=min(iw\\,ih):min(iw\\,ih)",
      "-c:v", "libvpx-vp9",
      "-crf", "33",
      "-b:v", "0",
      "-an",
      "-y",
      tmpOut,
    ]);
  } finally {
    await fs.unlink(tmpIn).catch(() => {});
  }

  const gifBuffer = await fs.readFile(tmpOut);
  await fs.unlink(tmpOut).catch(() => {});

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, gifBuffer);

  return res.status(200).type("application/json").send({ id: movieId });
});
