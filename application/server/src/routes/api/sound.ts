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
    // MP3 매직바이트 체크 (ID3 태그 또는 MPEG frame sync)
    const b0 = (req.body as Buffer)[0];
    const b1 = (req.body as Buffer)[1];
    const b2 = (req.body as Buffer)[2];
    const isMP3 =
      (b0 === 0x49 && b1 === 0x44 && b2 === 0x33) ||
      (b0 === 0xFF && ((b1 ?? 0) & 0xE0) === 0xE0);

    if (isMP3) {
      // 이미 MP3이면 그대로 복사 (ffmpeg 스킵)
      await fs.writeFile(outputPath, req.body);
    } else {
      await execFileAsync("ffmpeg", [
        "-i", tmpInput,
        ...metadataArgs,
        "-vn",
        "-b:a", "96k",
        "-ac", "1",
        "-y",
        outputPath,
      ]);
    }
  } catch {
    await fs.unlink(tmpInput).catch(() => {});
    throw new httpErrors.BadRequest("Invalid audio file or conversion failed");
  }

  await fs.unlink(tmpInput).catch(() => {});

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
