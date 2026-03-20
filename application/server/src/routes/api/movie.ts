import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertMovieToMp4 } from "@web-speed-hackathon-2026/server/src/utils/transcode_media.js";

// 変換した動画の拡張子
const EXTENSION = "mp4";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (
    type === undefined ||
    (type.mime.startsWith("video/") === false && type.ext !== EXTENSION)
  ) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  let converted: Buffer;
  try {
    converted = await convertMovieToMp4(req.body);
  } catch {
    throw new httpErrors.BadRequest("Invalid movie content");
  }

  const movieId = uuidv4();

  const filePath = path.resolve(
    UPLOAD_PATH,
    `./movies/${movieId}.${EXTENSION}`,
  );
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ id: movieId });
});
