import { promises as fs } from "fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

// 変換した音声の拡張子
const EXTENSION = "mp3";
const execFileAsync = promisify(execFile);

async function convertAudioToMp3(sourcePath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    sourcePath,
    "-vn",
    "-codec:a",
    "libmp3lame",
    "-qscale:a",
    "2",
    outputPath,
  ]);
}

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
  const tempDir = path.resolve(UPLOAD_PATH, "tmp");
  await fs.mkdir(tempDir, { recursive: true });

  const sourceExtension = type.ext ?? "bin";
  const tempSourcePath = path.resolve(tempDir, `${soundId}-src.${sourceExtension}`);
  const tempOutputPath = path.resolve(tempDir, `${soundId}-out.mp3`);

  await fs.writeFile(tempSourcePath, req.body);

  const { artist, title } = await extractMetadataFromSound(req.body);

  try {
    if (type.ext === EXTENSION) {
      await fs.copyFile(tempSourcePath, tempOutputPath);
    } else {
      await convertAudioToMp3(tempSourcePath, tempOutputPath);
    }

    const finalFilePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
    await fs.rename(tempOutputPath, finalFilePath);

    return res.status(200).type("application/json").send({ artist, id: soundId, title });
  } catch (err) {
    console.error("sound conversion failed:", err);
    throw new httpErrors.InternalServerError("Sound conversion failed");
  } finally {
    await fs.rm(tempSourcePath, { force: true }).catch(() => undefined);
    await fs.rm(tempOutputPath, { force: true }).catch(() => undefined);
  }
});
