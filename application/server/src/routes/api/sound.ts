import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { Router } from "express";
import ffmpeg from "fluent-ffmpeg";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const soundId = uuidv4();
  const tmpInput = path.resolve(os.tmpdir(), `${soundId}-input`);
  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);

  await fs.writeFile(tmpInput, req.body);

  const { artist, title } = await extractMetadataFromSound(req.body);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    ffmpeg(tmpInput)
      .noVideo()
      .audioCodec("libmp3lame")
      .outputOptions([`-metadata artist=${artist}`, `-metadata title=${title}`])
      .output(filePath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });

  await fs.unlink(tmpInput);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
