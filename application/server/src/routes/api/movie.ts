import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Movie } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import {
  convertMovieToWebm,
  generateMoviePoster,
  MediaConversionError,
} from "@web-speed-hackathon-2026/server/src/utils/convert_media";
import { readMovieDimensionsFromBuffer } from "@web-speed-hackathon-2026/server/src/utils/media_dimensions";

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

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !type.mime.startsWith("video/")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const [converted, poster] = await Promise.all([
    convertMovieToWebm(req.body),
    generateMoviePoster(req.body),
  ]).catch((error: unknown) => {
    if (error instanceof MediaConversionError) {
      throw new httpErrors.BadRequest("Invalid file type");
    }
    throw error;
  });
  const dimensions = await readMovieDimensionsFromBuffer(converted);

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  const posterPath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.jpg`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await Promise.all([
    fs.writeFile(filePath, converted),
    fs.writeFile(posterPath, poster),
    Movie.create({ id: movieId, ...dimensions }),
  ]);

  return res.status(200).type("application/json").send({ id: movieId, ...dimensions });
});
