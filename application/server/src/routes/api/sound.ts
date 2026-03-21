import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertSound } from "@web-speed-hackathon-2026/server/src/utils/convert_sound";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

// 変換した音声の拡張子
const EXTENSION = "mp3";
const ALLOWED_EXTENSIONS = new Set(["mp3", "wav"]);

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !ALLOWED_EXTENSIONS.has(type.ext)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  let body: Buffer = req.body;
  let artist: string | undefined;
  let title: string | undefined;

  if (type.ext !== EXTENSION) {
    // wav → MP3 変換（メタデータの文字コード変換も同時に行う）
    const result = await convertSound(req.body);
    body = result.data;
    artist = result.artist;
    title = result.title;
  } else {
    const metadata = await extractMetadataFromSound(body);
    artist = metadata.artist;
    title = metadata.title;
  }

  const soundId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, body);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
