import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertVideoToGif } from "@web-speed-hackathon-2026/server/src/utils/convert_video_to_gif";

const ACCEPTED_VIDEO_TYPES = ["mp4", "webm", "mov", "avi", "mkv", "3gp"];

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ACCEPTED_VIDEO_TYPES.includes(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const gifBuffer = await convertVideoToGif(req.body);

  const movieId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.gif`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, gifBuffer);

  return res.status(200).type("application/json").send({ id: movieId });
});
