import { promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

ffmpeg.setFfmpegPath(ffmpegPath.path);

const EXTENSION = "ogg";

function convertToOpus(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    ffmpeg(Readable.from(input))
      .audioCodec("libopus")
      .audioBitrate("64k")
      .format("ogg")
      .on("error", reject)
      .pipe()
      .on("data", (chunk: Buffer) => chunks.push(chunk))
      .on("end", () => resolve(Buffer.concat(chunks)));
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

  const soundId = uuidv4();

  // Extract metadata from the original file before conversion
  const { artist, title } = await extractMetadataFromSound(req.body);

  // Convert to Opus
  const opusBuffer = await convertToOpus(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, opusBuffer);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
