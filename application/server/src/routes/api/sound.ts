import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { calculateSoundWaveformPeaks } from "@web-speed-hackathon-2026/server/src/utils/calculate_sound_waveform_peaks";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const ACCEPTED_SOUND_EXTENSIONS = new Set(["mp3", "wav"]);
const LONG_CACHE_HEADER = "public, max-age=31536000, immutable";

async function resolveSoundFilePath(soundId: string) {
  const candidates = [
    path.resolve(UPLOAD_PATH, `./sounds/${soundId}.wav`),
    path.resolve(UPLOAD_PATH, `./sounds/${soundId}.mp3`),
    path.resolve(PUBLIC_PATH, `./sounds/${soundId}.mp3`),
  ];

  for (const filePath of candidates) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {}
  }

  return null;
}

function getSoundContentType(filePath: string) {
  if (filePath.endsWith(".wav")) {
    return "audio/wav";
  }
  return "audio/mpeg";
}

async function writeWaveformCache(soundId: string, inputBuffer: Buffer) {
  try {
    const waveformPeaks = await calculateSoundWaveformPeaks(inputBuffer);
    const waveformPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.waveform.json`);
    await fs.mkdir(path.dirname(waveformPath), { recursive: true });
    await fs.writeFile(waveformPath, JSON.stringify(waveformPeaks));
  } catch (error) {
    console.error("[sound waveform cache] failed", {
      error,
      soundId,
    });
  }
}

export const soundRouter = Router();

soundRouter.get("/sounds/:soundId/file", async (req, res) => {
  const soundId = req.params["soundId"];
  if (soundId == null || soundId === "") {
    throw new httpErrors.BadRequest();
  }

  const filePath = await resolveSoundFilePath(soundId);
  if (filePath == null) {
    throw new httpErrors.NotFound();
  }

  res.setHeader("Cache-Control", LONG_CACHE_HEADER);
  res.type(getSoundContentType(filePath));
  return res.sendFile(filePath);
});

soundRouter.get("/sounds/:soundId/waveform", async (req, res) => {
  const soundId = req.params["soundId"];
  if (soundId == null || soundId === "") {
    throw new httpErrors.BadRequest();
  }

  const waveformPath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.waveform.json`);

  try {
    const cached = await fs.readFile(waveformPath, "utf8");
    res.setHeader("Cache-Control", LONG_CACHE_HEADER);
    return res.type("application/json").send(cached);
  } catch {}

  const filePath = await resolveSoundFilePath(soundId);
  if (filePath == null) {
    throw new httpErrors.NotFound();
  }

  const soundBuffer = await fs.readFile(filePath);
  const waveformPeaks = await calculateSoundWaveformPeaks(soundBuffer);
  const payload = JSON.stringify(waveformPeaks);
  await fs.mkdir(path.dirname(waveformPath), { recursive: true });
  await fs.writeFile(waveformPath, payload);

  res.setHeader("Cache-Control", LONG_CACHE_HEADER);
  return res.type("application/json").send(payload);
});

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const fileType = await fileTypeFromBuffer(req.body);
  if (fileType == null || ACCEPTED_SOUND_EXTENSIONS.has(fileType.ext) === false) {
    throw new httpErrors.BadRequest("Invalid audio file");
  }

  const { artist, title } = await extractMetadataFromSound(req.body);

  const soundId = uuidv4();
  const extension = fileType.ext;

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${extension}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, req.body);
  void writeWaveformCache(soundId, req.body);

  return res.status(200).type("application/json").send({
    artist,
    id: soundId,
    title,
    waveformPeaks: [],
  });
});
