import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
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

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !type.mime.startsWith("audio/")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();
  const soundsDir = path.resolve(UPLOAD_PATH, "sounds");
  const filePath = path.resolve(soundsDir, `${soundId}.${EXTENSION}`);
  await fs.mkdir(soundsDir, { recursive: true });

  // WAVメタデータは変換前に元バッファから取得
  const { artist, title } = await extractMetadataFromSound(req.body);

  if (type.ext !== EXTENSION) {
    const tmpPath = path.resolve(soundsDir, `${soundId}_tmp.${type.ext}`);
    await fs.writeFile(tmpPath, req.body);
    await execFileAsync("ffmpeg", ["-y", "-i", tmpPath, filePath]);
    await fs.unlink(tmpPath);
  } else {
    await fs.writeFile(filePath, req.body);
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
