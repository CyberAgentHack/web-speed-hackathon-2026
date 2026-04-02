import { promises as fs } from "fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した動画の拡張子
const EXTENSION = "gif";
const execFileAsync = promisify(execFile);

async function convertVideoToGif(
  sourcePath: string,
  outputPath: string,
  size = 480,
): Promise<void> {
  const vf = `crop='min(iw,ih)':'min(iw,ih)',scale=${size}:${size}`;
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    sourcePath,
    "-t",
    "5",
    "-r",
    "10",
    "-vf",
    vf,
    "-an",
    outputPath,
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
  if (type === undefined || !type.mime.startsWith("video/")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const tempDir = path.resolve(UPLOAD_PATH, "tmp");
  await fs.mkdir(tempDir, { recursive: true });

  const sourceExtension = type.ext ?? "bin";
  const tempSourcePath = path.resolve(tempDir, `${movieId}-src.${sourceExtension}`);
  const tempOutputPath = path.resolve(tempDir, `${movieId}-out.${EXTENSION}`);

  await fs.writeFile(tempSourcePath, req.body);

  try {
    if (type.ext === EXTENSION) {
      await fs.copyFile(tempSourcePath, tempOutputPath);
    } else {
      await convertVideoToGif(tempSourcePath, tempOutputPath);
    }

    const finalFilePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
    await fs.rename(tempOutputPath, finalFilePath);

    return res.status(200).type("application/json").send({ id: movieId });
  } catch (err) {
    console.error("movie conversion failed:", err);
    throw new httpErrors.InternalServerError("Movie conversion failed");
  } finally {
    await fs.rm(tempSourcePath, { force: true }).catch(() => undefined);
    await fs.rm(tempOutputPath, { force: true }).catch(() => undefined);
  }
});
