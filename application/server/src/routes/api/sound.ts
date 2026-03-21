import { promises as fs } from "fs";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import { Hono } from "hono";
import type { Context } from "hono";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const EXTENSION = "mp3";

export const soundRouter = new Hono();

soundRouter.post("/sounds", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  if (session["userId"] === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const rawBody = c.get("rawBody" as never) as Buffer | undefined;
  if (!rawBody) {
    return c.json({ message: "Bad Request" }, 400);
  }

  const type = await fileTypeFromBuffer(rawBody);
  if (type === undefined || type.ext !== EXTENSION) {
    return c.json({ message: "Invalid file type" }, 400);
  }

  const soundId = crypto.randomUUID();

  const { artist, title } = await extractMetadataFromSound(rawBody);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, rawBody);

  return c.json({ artist, id: soundId, title }, 200);
});
