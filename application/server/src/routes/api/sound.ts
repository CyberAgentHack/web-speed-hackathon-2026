import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { OfflineAudioContext } from "node-web-audio-api";
import { v4 as uuidv4 } from "uuid";

import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { uploadFileToS3 } from "@web-speed-hackathon-2026/server/src/utils/s3";

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

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(req.body);

  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const buffer = await audioCtx.decodeAudioData((req.body.buffer as ArrayBuffer).slice(req.body.byteOffset, req.body.byteOffset + req.body.byteLength));

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;

  const length = buffer.length;
  const numChunks = 100;
  const chunkSize = length / numChunks;
  const peaks: number[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = Math.floor(i * chunkSize);
    const end = Math.floor((i + 1) * chunkSize);
    
    let sum = 0;
    for (let j = start; j < end; j++) {
      const leftAbs = Math.abs(leftChannel[j] ?? 0);
      const rightAbs = Math.abs(rightChannel[j] ?? 0);
      sum += (leftAbs + rightAbs) / 2;
    }
    const count = end - start;
    peaks.push(count > 0 ? sum / count : 0);
  }

  await uploadFileToS3(`sounds/${soundId}.${EXTENSION}`, req.body, type.mime);

  return res.status(200).type("application/json").send({ artist, id: soundId, title, peaks });
});
