import fs from "node:fs/promises";
import path from "node:path";

import { Hono } from "hono";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function tryServeFile(
  dir: string,
  urlPath: string,
): Promise<{ content: Buffer; mimeType: string } | null> {
  const resolved = path.resolve(dir);
  const filePath = path.resolve(resolved, "." + urlPath);

  if (!filePath.startsWith(resolved)) return null;

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";
    return { content, mimeType };
  } catch {
    return null;
  }
}

export const staticRouter = new Hono<AppEnv>();

staticRouter.use("*", async (c, next) => {
  const urlPath = new URL(c.req.url).pathname;

  for (const dir of [UPLOAD_PATH, PUBLIC_PATH, CLIENT_DIST_PATH]) {
    const result = await tryServeFile(dir, urlPath);
    if (result) {
      return c.newResponse(result.content, 200, {
        "Cache-Control": "public, max-age=60",
        "Content-Type": result.mimeType,
      });
    }
  }

  // SPA フォールバック: index.html を返す
  try {
    const content = await fs.readFile(path.join(CLIENT_DIST_PATH, "index.html"));
    return c.newResponse(content, 200, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/html; charset=utf-8",
    });
  } catch {
    return next();
  }
});
