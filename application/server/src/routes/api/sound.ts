import { execFile } from "node:child_process";
import { promises as fs } from "fs";
import os from "node:os";
import path from "path";
import { promisify } from "node:util";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execFileAsync = promisify(execFile);
const ALLOWED_AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "flac"]);

export const soundRouter = Router();

async function convertToMp3(inputBuffer: Buffer, inputExt: string): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wsh-sound-"));
  const inputPath = path.join(tmpDir, `input.${inputExt}`);
  const outputPath = path.join(tmpDir, "output.mp3");
  try {
    await fs.writeFile(inputPath, inputBuffer);
    await execFileAsync("ffmpeg", [
      "-y", "-i", inputPath,
      "-codec:a", "libmp3lame", "-b:a", "128k",
      outputPath,
    ]);
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ALLOWED_AUDIO_EXTENSIONS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(req.body);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });

  // Always save as MP3 (Sound model's extension VIRTUAL field returns "mp3")
  if (type.ext === "mp3") {
    const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.mp3`);
    await fs.writeFile(filePath, req.body);
  } else {
    const mp3Buffer = await convertToMp3(req.body, type.ext);
    const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.mp3`);
    await fs.writeFile(filePath, mp3Buffer);
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title, extension: "mp3" });
});
