import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertToGif } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";

const EXTENSION = "gif";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // サーバーサイドでGIFに変換（クライアントWASM不要）
  const converted = await convertToGif(req.body);

  const movieId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ id: movieId });
});
