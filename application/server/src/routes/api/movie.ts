import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した動画の拡張子
const EXTENSION = "webm";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    console.error("Unauthorized access to /api/v1/movies");
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    console.error("Invalid request body for /api/v1/movies: expected Buffer");
    throw new httpErrors.BadRequest();
  }

  // const type = await fileTypeFromBuffer(req.body);
  // if (type === undefined || type.ext !== EXTENSION) {
  //   console.error("Invalid file type for /api/v1/movies", type);
  //   throw new httpErrors.BadRequest("Invalid file type");
  // }

  const movieId = uuidv4();

  const filePath = path.resolve(
    UPLOAD_PATH,
    `./movies/${movieId}.${EXTENSION}`,
  );
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ id: movieId });
});
