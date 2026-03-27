import { promises as fs } from "fs";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";
import { badRequest, unauthorized } from "@web-speed-hackathon-2026/server/src/utils/http_error";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { readBinaryBody } from "@web-speed-hackathon-2026/server/src/utils/request_body";

const EXTENSION = "mp3";

export const soundRouter = new Hono<Env>();

soundRouter.post("/sounds", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const buffer = await readBinaryBody(c.req.raw);
  if (buffer.length === 0) {
    badRequest();
  }

  const type = await fileTypeFromBuffer(buffer);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new HTTPException(400, { message: "Invalid file type" });
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(buffer);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, buffer);

  return c.json({ artist, id: soundId, title });
});
