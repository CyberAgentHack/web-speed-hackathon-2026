import { promises as fs } from "fs";
import path from "path";
import os from "os";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

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

  const movieId = uuidv4();
  const tempInputPath = path.join(os.tmpdir(), `${movieId}_input`);
  const outputPath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);

  try {
    await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
    await fs.writeFile(tempInputPath, req.body);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .output(outputPath)
        .size("320x?") // Resize for better performance
        .videoCodec("libx264")
        .outputOptions([
          "-pix_fmt yuv420p", // Compatibility
          "-movflags +faststart", // Enable early playback
          "-crf 28", // Balance quality and size
          "-preset faster",
          "-tune fastdecode",
        ])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    return res.status(200).type("application/json").send({ id: movieId });
  } catch (error) {
    console.error("Movie processing error:", error);
    throw new httpErrors.BadRequest("Invalid movie or conversion failed");
  } finally {
    try {
      await fs.unlink(tempInputPath);
    } catch {
      // Ignore cleanup error
    }
  }
});
