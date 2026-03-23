import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertMovieToWebm } from "@web-speed-hackathon-2026/server/src/utils/convert_movie";

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

  // WebM 以外の動画ならサーバー側で WebM に変換
  const webmBuffer = await convertMovieToWebm(req.body);

  const movieId = uuidv4();

  const filePath = path.resolve(
    UPLOAD_PATH,
    `./movies/${movieId}.${EXTENSION}`,
  );
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, webmBuffer);

  return res.status(200).type("application/json").send({ id: movieId });
});
