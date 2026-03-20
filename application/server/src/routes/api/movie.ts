import { promises as fs } from "fs";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { getSession } from "@web-speed-hackathon-2026/server/src/session";

// 変換した動画の拡張子
const EXTENSION = "gif";

export const movieRouter = new Hono();

movieRouter.post("/movies", async (c) => {
  const userId = getSession(c);
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  const arrayBuffer = await c.req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new HTTPException(400);
  }

  const type = await fileTypeFromBuffer(buffer);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new HTTPException(400, { message: "Invalid file type" });
  }

  const movieId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, buffer);

  return c.json({ id: movieId });
});
