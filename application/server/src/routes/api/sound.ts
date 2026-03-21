import { promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Sound } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

// ffmpeg のパスを設定
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// 変換した音声の拡張子
const EXTENSION = "opus";

// MP3 → Opus に変換
async function convertToOpus(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    ffmpeg(Readable.from(input))
      .audioCodec("libopus")
      .audioBitrate("64k")
      .format("opus")
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on("data", (chunk: Buffer) => chunks.push(chunk));
  });
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
  if (type === undefined || type.ext !== "mp3") {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const metadata = await extractMetadataFromSound(req.body);
  const artist = metadata.artist ?? "Unknown";
  const title = metadata.title ?? "Unknown";

  // MP3 → Opus に変換
  const opusBuffer = await convertToOpus(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, opusBuffer);
  await Sound.create({ artist, id: soundId, title });

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
