import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertMovieToWebm, extractPosterFromVideo } from "@web-speed-hackathon-2026/server/src/utils/convert_media";

const EXTENSION = "webm";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !(type.mime.startsWith("video/") || type.mime === "image/gif")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();

  const moviesDir = path.resolve(UPLOAD_PATH, "movies");
  await fs.mkdir(moviesDir, { recursive: true });

  // Run VP9 conversion and poster extraction in parallel from the original input
  const [outputBuffer, posterBuffer] = await Promise.all([
    convertMovieToWebm(req.body),
    extractPosterFromVideo(req.body),
  ]);

  await Promise.all([
    fs.writeFile(path.resolve(moviesDir, `${movieId}.${EXTENSION}`), outputBuffer),
    fs.writeFile(path.resolve(moviesDir, `${movieId}-poster.webp`), posterBuffer),
  ]);

  return res.status(200).type("application/json").send({ id: movieId });
});
