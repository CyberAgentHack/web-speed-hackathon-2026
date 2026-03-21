import { promises as fs } from "fs";
import { createRequire } from "module";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const piexif = require("piexifjs") as {
  load: (binary: string) => Record<string, Record<number, unknown>>;
  ImageIFD: Record<string, number>;
};

// 変換した画像の拡張子
const EXTENSION = "jpg";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
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

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, req.body);

  let alt = "";
  try {
    const exif = piexif.load((req.body as Buffer).toString("binary"));
    const raw = exif?.["0th"]?.[0x010e]; // ImageIFD.ImageDescription = 270
    if (raw != null) {
      alt = new TextDecoder().decode(Buffer.from(raw as string, "binary"));
    }
  } catch {
    // EXIF が存在しない場合は無視
  }

  return res.status(200).type("application/json").send({ id: imageId, alt });
});
