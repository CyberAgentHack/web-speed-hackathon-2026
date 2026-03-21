import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertMovie } from "@web-speed-hackathon-2026/server/src/utils/convert_movie";

const EXTENSION = "mp4";
const ALLOWED_EXTENSIONS = new Set(["mp4", "mkv", "webm", "avi", "mov"]);

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

  const movieId = uuidv4();

  let mp4Buffer: Buffer;
  try {
    mp4Buffer = await convertMovie(req.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("timed out") ||
      message.includes("ENOMEM") ||
      message.includes("ENOSPC") ||
      message.includes("EPERM")
    ) {
      console.error("[movie] server error during conversion:", message);
      throw new httpErrors.InternalServerError("Video conversion failed");
    }
    throw new httpErrors.BadRequest("Failed to convert video file");
  }

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, mp4Buffer);

  return res.status(200).type("application/json").send({ id: movieId });
});
