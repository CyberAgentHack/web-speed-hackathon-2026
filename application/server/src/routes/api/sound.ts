import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execFileAsync = promisify(execFile);

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

  const { artist, title } = await extractMetadataFromSound(req.body);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(inputPath, req.body);

  try {
    const args = ["-i", inputPath, "-y", outputPath];
    if (title) {
      args.splice(-1, 0, "-metadata", `title=${title}`);
    }
    if (artist) {
      args.splice(-1, 0, "-metadata", `artist=${artist}`);
    }
    await execFileAsync(ffmpegPath.path, args);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
