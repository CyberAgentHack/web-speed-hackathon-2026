import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { cropMovie } from "../../medias/movie";

export const movieRouter = Router();

const videoMimeTypes = new Set([
  "video/mp4",
  "video/mpeg",
  "video/ogg",
  "video/webm",
  "video/quicktime",
]);

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || videoMimeTypes.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();

  const originalFilePath = path.resolve(UPLOAD_PATH, `./movies/_orig/${movieId}.${type.ext}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies/_orig"), { recursive: true });
  await fs.writeFile(originalFilePath, req.body);

  await cropMovie(
    originalFilePath,
    path.resolve(UPLOAD_PATH, `./movies/${movieId}.mp4`),
  );

  return res.status(200).type("application/json").send({ id: movieId });
});
