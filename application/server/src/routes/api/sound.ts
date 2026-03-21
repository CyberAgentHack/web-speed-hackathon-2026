import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Sound } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { extractWavMetadata } from "@web-speed-hackathon-2026/server/src/utils/extract_wav_metadata";

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

  // Try to extract metadata from WAV INFO chunk first (handles Shift-JIS)
  let artist: string | undefined;
  let title: string | undefined;

  const wavMeta = extractWavMetadata(req.body);
  if (wavMeta.artist || wavMeta.title) {
    artist = wavMeta.artist;
    title = wavMeta.title;
  }

  // Check if this is already an MP3 or needs conversion
  const isWav = req.body.length >= 4 && req.body.toString("ascii", 0, 4) === "RIFF";
  let mp3Buffer: Buffer;

  if (isWav) {
    // Convert WAV to MP3 using ffmpeg
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
    const inputPath = path.join(tmpDir, "input.wav");
    const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

    try {
      await fs.writeFile(inputPath, req.body);

      const args = [
        "-i", inputPath,
        "-vn",
      ];

      // Re-attach metadata if available
      if (artist) {
        args.push("-metadata", `artist=${artist}`);
      }
      if (title) {
        args.push("-metadata", `title=${title}`);
      }

      args.push("-y", outputPath);

      await execFileAsync("ffmpeg", args);
      mp3Buffer = await fs.readFile(outputPath);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  } else {
    // Already MP3 or other format - try to use as-is, extract metadata with music-metadata
    mp3Buffer = req.body;
    if (!artist && !title) {
      const meta = await extractMetadataFromSound(req.body);
      artist = meta.artist;
      title = meta.title;
    }
  }

  const soundsDir = path.resolve(UPLOAD_PATH, "sounds");
  await fs.mkdir(soundsDir, { recursive: true });
  await fs.writeFile(path.resolve(soundsDir, `${soundId}.${EXTENSION}`), mp3Buffer);

  await Sound.create({ id: soundId, artist: artist || "Unknown", title: title || "Unknown" });

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
