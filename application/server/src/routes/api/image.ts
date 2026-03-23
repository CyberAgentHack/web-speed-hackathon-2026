import { promises as fs } from "fs";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import { Hono } from "hono";
import type { Context } from "hono";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "avif";

export const imageRouter = new Hono();

imageRouter.post("/images", async (c: Context) => {
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

  const imageId = crypto.randomUUID();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, rawBody);

  return c.json({ id: imageId }, 200);
});
