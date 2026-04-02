import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

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

  const soundId = uuidv4();
  const soundsDir = path.resolve(UPLOAD_PATH, "sounds");
  await fs.mkdir(soundsDir, { recursive: true });

  // 一時ファイルに保存
  const tmpInput = path.join(os.tmpdir(), `${soundId}-input`);
  await fs.writeFile(tmpInput, req.body);

  const outputPath = path.resolve(soundsDir, `${soundId}.${EXTENSION}`);

  try {
    execSync(
      `ffmpeg -i "${tmpInput}" -metadata "artist=${artist}" -metadata "title=${title}" -b:a 128k -vn -y "${outputPath}"`,
      { stdio: "pipe" },
    );
  } catch {
    await fs.unlink(tmpInput).catch(() => {});
    throw new httpErrors.BadRequest("Failed to convert sound");
  }

  await fs.unlink(tmpInput).catch(() => {});

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
