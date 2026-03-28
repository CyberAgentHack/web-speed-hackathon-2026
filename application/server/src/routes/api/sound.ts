import { promises as fs } from "fs";
import path from "path";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";
import { convertToMp3 } from "@web-speed-hackathon-2026/server/src/utils/convert_to_mp3";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const EXTENSION = "mp3";

export const soundRouter = new Hono<AppEnv>();

soundRouter.post("/sounds", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const arrayBuffer = await c.req.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  if (body.length === 0) {
    throw new HTTPException(400);
  }

  const mp3Buffer = await convertToMp3(body);

  const soundId = uuidv4();
  const { artist, title } = await extractMetadataFromSound(mp3Buffer);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, mp3Buffer);

  return c.json({ artist, id: soundId, title }, 200);
});
