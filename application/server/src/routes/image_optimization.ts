import { execFile } from "node:child_process";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { Hono } from "hono";

const execFileAsync = promisify(execFile);

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const avifCache = new Map<string, Buffer>();

export const imageOptimizationRouter = new Hono<SessionEnv>();

imageOptimizationRouter.get("*", async (c, next) => {
  if (!/\.(jpg|jpeg|png)$/i.test(c.req.path)) {
    return next();
  }

  const acceptHeader = c.req.header("accept") ?? "";
  const supportsAvif = acceptHeader.includes("image/avif");

  if (!supportsAvif) {
    return next();
  }

  const requestPath = decodeURIComponent(c.req.path);
  const avifPath = requestPath.replace(/\.(jpg|jpeg|png)$/i, ".avif");

  // 1. Check in-memory cache
  if (avifCache.has(requestPath)) {
    c.header("Content-Type", "image/avif");
    c.header("Cache-Control", "public, max-age=86400");
    c.header("Vary", "Accept");
    return c.body(new Uint8Array(avifCache.get(requestPath)!));
  }

  // 2. Check for pre-generated AVIF file on disk
  const avifCandidates = [path.join(UPLOAD_PATH, avifPath), path.join(PUBLIC_PATH, avifPath)];
  for (const candidate of avifCandidates) {
    if (fs.existsSync(candidate)) {
      const buf = fs.readFileSync(candidate);
      avifCache.set(requestPath, buf as Buffer);
      c.header("Content-Type", "image/avif");
      c.header("Cache-Control", "public, max-age=86400");
      c.header("Vary", "Accept");
      return c.body(new Uint8Array(buf));
    }
  }

  // 3. Fall back to on-the-fly conversion for uploaded images
  const jpgCandidates = [path.join(UPLOAD_PATH, requestPath), path.join(PUBLIC_PATH, requestPath)];
  let originalPath: string | null = null;
  for (const candidate of jpgCandidates) {
    try {
      await fsp.access(candidate);
      originalPath = candidate;
      break;
    } catch {
      // not found
    }
  }

  if (originalPath == null) {
    return next();
  }

  try {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "avif-"));
    const tmpOut = path.join(tmpDir, "output.avif");
    try {
      await execFileAsync("ffmpeg", [
        "-i",
        originalPath,
        "-c:v",
        "libaom-av1",
        "-crf",
        "30",
        "-cpu-used",
        "6",
        "-y",
        tmpOut,
      ]);
      const avifBuffer = await fsp.readFile(tmpOut);
      avifCache.set(requestPath, avifBuffer as Buffer);
      c.header("Content-Type", "image/avif");
      c.header("Cache-Control", "public, max-age=86400");
      c.header("Vary", "Accept");
      return c.body(new Uint8Array(avifBuffer));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  } catch {
    return next();
  }
});
