import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { Router } from "express";
import Ffmpeg from "fluent-ffmpeg";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const OUTPUT_EXTENSION = "gif";

export const movieRouter = Router();

function convertToGif(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Ffmpeg(inputPath)
      .outputOptions(["-t", "5", "-r", "10", "-vf", "crop='min(iw,ih)':'min(iw,ih)'", "-an"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const movieId = uuidv4();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const tmpInput = path.join(tmpDir, "input");
  const outputPath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${OUTPUT_EXTENSION}`);

  try {
    await fs.writeFile(tmpInput, req.body);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
    await convertToGif(tmpInput, outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
