import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execFileAsync = promisify(execFile);

// 変換した音声の拡張子
const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const { artist, title } = await extractMetadataFromSound(req.body);

  const tmpInput = path.resolve(os.tmpdir(), `${uuidv4()}_input`);
  const soundId = uuidv4();
  const outputPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(tmpInput, req.body);

  const metadataArgs: string[] = [];
  if (artist) metadataArgs.push("-metadata", `artist=${artist}`);
  if (title) metadataArgs.push("-metadata", `title=${title}`);

  try {
    await execFileAsync("ffmpeg", [
      "-i", tmpInput,
      ...metadataArgs,
      "-vn",
      "-b:a", "96k",
      "-ac", "1",
      "-y",
      outputPath,
    ]);
  } catch {
    await fs.unlink(tmpInput).catch(() => {});
    throw new httpErrors.BadRequest("Invalid audio file or conversion failed");
  }

  await fs.unlink(tmpInput).catch(() => {});

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
