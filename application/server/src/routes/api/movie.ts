import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した動画の拡張子
const EXTENSION = "mp4";

const MOVIE_ASSET = { ext: "mp4", mime: "video/mp4" } as const;

export const movieRouter = Router();

movieRouter.get("/movies/:movieId", async (req, res) => {
  const movieId = req.params["movieId"];
  if (movieId == null || movieId === "") {
    throw new httpErrors.NotFound();
  }

  const lookupPaths = [
    path.resolve(UPLOAD_PATH, `./movies/${movieId}.${MOVIE_ASSET.ext}`),
    path.resolve(PUBLIC_PATH, `./movies/${movieId}.${MOVIE_ASSET.ext}`),
  ];

  for (const lookupPath of lookupPaths) {
    try {
      await fs.access(lookupPath);
      return res.status(200).type(MOVIE_ASSET.mime).sendFile(lookupPath);
    } catch {
      // next candidate
    }
  }

  throw new httpErrors.NotFound();
});

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== EXTENSION || type.mime !== "video/mp4") {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  return res.status(200).type("application/json").send({ id: movieId });
});
