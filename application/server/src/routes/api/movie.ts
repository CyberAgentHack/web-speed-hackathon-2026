import { promises as fs } from "fs";
import path from "path";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";
import { convertToMp4 } from "@web-speed-hackathon-2026/server/src/utils/convert_to_mp4";

const EXTENSION = "mp4";

export const movieRouter = new Hono<AppEnv>();

movieRouter.post("/movies", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const arrayBuffer = await c.req.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  if (body.length === 0) {
    throw new HTTPException(400);
  }

  const mp4Buffer = await convertToMp4(body);

  const movieId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, mp4Buffer);

  return c.json({ id: movieId }, 200);
});
