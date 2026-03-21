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

const OUTPUT_EXTENSION = "webm";

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
  const outputPath = path.join(tmpDir, `output.${OUTPUT_EXTENSION}`);

  try {
    await fs.writeFile(inputPath, req.body);

    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-t",
        "5",
        "-r",
        "10",
        "-vf",
        "crop=min(iw\\,ih):min(iw\\,ih)",
        "-c:v",
        "libvpx-vp9",
        "-crf",
        "30",
        "-b:v",
        "0",
        "-an",
        outputPath,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const outputData = await fs.readFile(outputPath);

    await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
    const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${OUTPUT_EXTENSION}`);
    await fs.writeFile(filePath, outputData);
  } catch (err) {
    console.error("[movie upload] ffmpeg error:", err);
    throw new httpErrors.BadRequest("Movie conversion failed");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
