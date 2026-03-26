import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || (type.ext !== "gif" && type.ext !== "mp4")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const moviesDir = path.resolve(UPLOAD_PATH, "movies");
  await fs.mkdir(moviesDir, { recursive: true });

  if (type.ext === "gif") {
    const tmpGif = path.resolve(moviesDir, `${movieId}.gif`);
    await fs.writeFile(tmpGif, req.body);

    const mp4Path = path.resolve(moviesDir, `${movieId}.mp4`);
    execSync(
      `ffmpeg -i "${tmpGif}" -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -crf 28 -an "${mp4Path}" 2>/dev/null`,
    );
    await fs.unlink(tmpGif);
  } else {
    const mp4Path = path.resolve(moviesDir, `${movieId}.mp4`);
    await fs.writeFile(mp4Path, req.body);
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
