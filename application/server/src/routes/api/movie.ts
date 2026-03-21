import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertMovie } from "@web-speed-hackathon-2026/server/src/utils/convert_movie";

// 変換した動画の拡張子
const EXTENSION = "gif";
const ALLOWED_EXTENSIONS = new Set(["gif", "mkv", "webm"]);

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ALLOWED_EXTENSIONS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  let body: Buffer = req.body;

  // gif 以外の場合はサーバーサイドで GIF に変換
  if (type.ext !== EXTENSION) {
    body = await convertMovie(req.body);
  }

  const movieId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, body);

  return res.status(200).type("application/json").send({ id: movieId });
});
