import { execFile } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execFileAsync = promisify(execFile);

// 変換した音声の拡張子
const EXTENSION = "opus";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const { artist, title } = await extractMetadataFromSound(req.body);

  const inputPath = path.resolve(tmpdir(), uuidv4());
  const soundId = uuidv4();
  const outputPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(inputPath, req.body);

  const args = ["-i", inputPath, "-vn", "-c:a", "libopus", "-b:a", "96k"];
  if (artist) args.push("-metadata", `artist=${artist}`);
  if (title) args.push("-metadata", `title=${title}`);
  args.push(outputPath);

  try {
    await execFileAsync("ffmpeg", args);
  } catch {
    throw new httpErrors.BadRequest("Invalid audio file");
  } finally {
    await fs.unlink(inputPath).catch(() => {});
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
