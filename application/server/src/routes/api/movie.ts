import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertMovie } from "@web-speed-hackathon-2026/server/src/utils/convert_movie";
import { extractThumbnail } from "@web-speed-hackathon-2026/server/src/utils/extract_thumbnail";

const EXTENSION = "mp4";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const converted = await convertMovie(req.body);

  const movieId = uuidv4();

  const moviesDir = path.resolve(UPLOAD_PATH, "movies");
  const thumbnailsDir = path.resolve(UPLOAD_PATH, "movies/thumbnails");
  await fs.mkdir(moviesDir, { recursive: true });
  await fs.mkdir(thumbnailsDir, { recursive: true });

  const filePath = path.resolve(moviesDir, `${movieId}.${EXTENSION}`);
  await fs.writeFile(filePath, converted);

  const thumbnail = await extractThumbnail(converted);
  await fs.writeFile(path.resolve(thumbnailsDir, `${movieId}.avif`), thumbnail);

  return res.status(200).type("application/json").send({ id: movieId });
});
