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

  const tmpInput = path.resolve(os.tmpdir(), `${uuidv4()}_input`);
  const movieId = uuidv4();
  const outputPath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(tmpInput, req.body);

  try {
    // 先頭 5 秒のみ、正方形にくり抜かれた無音 MP4 を生成する
    await execFileAsync("ffmpeg", [
      "-i", tmpInput,
      "-t", "5",
      "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
      "-c:v", "libx264",
      "-crf", "28",
      "-preset", "ultrafast",
      "-an",
      "-movflags", "+faststart",
      "-y",
      outputPath,
    ]);
  } catch {
    await fs.unlink(tmpInput).catch(() => {});
    throw new httpErrors.BadRequest("Invalid video file or conversion failed");
  }

  await fs.unlink(tmpInput).catch(() => {});

  return res.status(200).type("application/json").send({ id: movieId });
});
