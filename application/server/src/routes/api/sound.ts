import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { Router } from "express";
import Ffmpeg from "fluent-ffmpeg";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const OUTPUT_EXTENSION = "mp3";

export const soundRouter = Router();

function convertToMp3(
  inputPath: string,
  outputPath: string,
  metadata: { artist: string; title: string } | undefined,
): Promise<void> {
  const outputOptions = ["-vn"];
  if (metadata != null) {
    outputOptions.push("-metadata", `artist=${metadata.artist}`, "-metadata", `title=${metadata.title}`);
  }

  return new Promise((resolve, reject) => {
    Ffmpeg(inputPath)
      .outputOptions(outputOptions)
      .audioCodec("libmp3lame")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

function sanitizeMetadataText(text: string | undefined): string | undefined {
  if (text == null) {
    return undefined;
  }

  const sanitized = text
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();

  return sanitized === "" ? undefined : sanitized;
}

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const soundId = uuidv4();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const tmpInput = path.join(tmpDir, "input");
  const outputPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${OUTPUT_EXTENSION}`);

  const extractedMetadata = await extractMetadataFromSound(req.body);
  const artist = sanitizeMetadataText(extractedMetadata.artist) ?? "Unknown Artist";
  const title = sanitizeMetadataText(extractedMetadata.title) ?? "Unknown Title";

  try {
    await fs.writeFile(tmpInput, req.body);
    await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
    try {
      await convertToMp3(tmpInput, outputPath, { artist, title });
    } catch {
      // メタデータ起因で ffmpeg が失敗するケースに備えて再試行する
      await convertToMp3(tmpInput, outputPath, undefined);
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
