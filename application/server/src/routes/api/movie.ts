import { promises as fs } from "fs";
import path from "path";

import bodyParser from "body-parser";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertToMp4 } from "@web-speed-hackathon-2026/server/src/utils/convert_to_mp4";

const EXTENSION = "mp4";

export const movieRouter = Router();

movieRouter.post("/movies", bodyParser.raw({ limit: "10mb" }), async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const gifBuffer = await convertToMp4(req.body);

  const movieId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, gifBuffer);

  return res.status(200).type("application/json").send({ id: movieId });
});
