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

  const soundId = uuidv4();
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${soundId}_input`);
  const outputPath = path.join(tmpDir, `${soundId}.${EXTENSION}`);

  try {
    await fs.writeFile(inputPath, req.body);

    await execFileAsync("ffmpeg", [
      "-i", inputPath,
      "-y",
      "-map_metadata", "0",
      "-id3v2_version", "3",
      "-codec:a", "libmp3lame",
      "-q:a", "2",
      outputPath,
    ]);

    const outputBuffer = await fs.readFile(outputPath);
    // Try extracting from original input first (handles Shift-JIS WAV), fall back to converted MP3
    let { artist, title } = await extractMetadataFromSound(req.body as Buffer);
    if (!artist && !title) {
      ({ artist, title } = await extractMetadataFromSound(outputBuffer));
    }

    const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
    await fs.writeFile(filePath, outputBuffer);

    return res.status(200).type("application/json").send({ artist, id: soundId, title });
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
});
