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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

  try {
    await fs.writeFile(inputPath, req.body);

    await execFileAsync(
      "ffmpeg",
      ["-y", "-i", inputPath, "-vn", outputPath],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const outputData = await fs.readFile(outputPath);

    const { artist, title } = await extractMetadataFromSound(outputData);

    await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
    const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
    await fs.writeFile(filePath, outputData);

    return res.status(200).type("application/json").send({ artist, id: soundId, title });
  } catch (err) {
    console.error("[sound upload] ffmpeg error:", err);
    throw new httpErrors.BadRequest("Sound conversion failed");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
