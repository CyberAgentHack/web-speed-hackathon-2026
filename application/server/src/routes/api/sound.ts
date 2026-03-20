import { promises as fs } from "fs";
import path from "path";
import os from "os";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

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
  const tempInputPath = path.join(os.tmpdir(), `${soundId}_input`);
  const outputPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);

  try {
    const { artist, title } = await extractMetadataFromSound(req.body);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
    await fs.writeFile(tempInputPath, req.body);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .toFormat(EXTENSION)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    return res.status(200).type("application/json").send({ artist, id: soundId, title });
  } catch (error) {
    console.error("Sound processing error:", error);
    throw new httpErrors.BadRequest("Invalid sound or conversion failed");
  } finally {
    try {
      await fs.unlink(tempInputPath);
    } catch {
      // Ignore cleanup error
    }
  }
});
