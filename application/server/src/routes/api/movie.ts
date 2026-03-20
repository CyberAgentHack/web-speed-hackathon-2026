import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { Router } from "express";
import ffmpeg from "fluent-ffmpeg";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "gif";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const movieId = uuidv4();
  const tmpInput = path.resolve(os.tmpdir(), `${movieId}-input`);
  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);

  await fs.writeFile(tmpInput, req.body);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    ffmpeg(tmpInput)
      .duration(5)
      .fps(10)
      .videoFilter("crop='min(iw,ih)':'min(iw,ih)'")
      .noAudio()
      .output(filePath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });

  await fs.unlink(tmpInput);

  return res.status(200).type("application/json").send({ id: movieId });
});
