import type { NextFunction, Request, Response } from "express";
import { constants as fsConstants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable, no-transform";

const RASTER_RE = /\.(jpe?g|png|webp)$/i;

function isSafeRelativeTo(baseDir: string, absoluteFile: string): boolean {
  const base = path.resolve(baseDir);
  const file = path.resolve(absoluteFile);
  const rel = path.relative(base, file);
  return rel !== "" && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveRasterFile(urlPath: string): Promise<string | null> {
  const relative = urlPath.replace(/^\/+/, "");
  if (relative.includes("..") || path.isAbsolute(relative)) {
    return null;
  }
  if (!relative.startsWith("images/")) {
    return null;
  }
  if (!RASTER_RE.test(relative)) {
    return null;
  }

  for (const base of [UPLOAD_PATH, PUBLIC_PATH]) {
    const candidate = path.join(base, relative);
    if (!isSafeRelativeTo(base, candidate)) {
      continue;
    }
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

export async function optimizeRasterImages(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET") {
    return next();
  }

  const urlPath = req.path.split("?")[0] ?? req.path;
  if (!RASTER_RE.test(urlPath ?? "")) {
    return next();
  }

  const absolute = await resolveRasterFile(urlPath);
  if (absolute === null) {
    return next();
  }

  try {
    const input = await readFile(absolute);
    let pipeline = sharp(input, { failOn: "none" }).rotate().resize({
      width: 2048,
      height: 2048,
      fit: "inside",
      withoutEnlargement: true,
    });

    const accept = req.get("accept") ?? "";
    if (accept.includes("image/webp")) {
      const out = await pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
      res.set("Cache-Control", CACHE_CONTROL_IMMUTABLE);
      res.set("Vary", "Accept");
      res.type("image/webp");
      return res.send(out);
    }

    const ext = path.extname(absolute).toLowerCase();
    if (ext === ".png") {
      const out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      res.set("Cache-Control", CACHE_CONTROL_IMMUTABLE);
      res.type("image/png");
      return res.send(out);
    }

    const out = await pipeline
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer();
    res.set("Cache-Control", CACHE_CONTROL_IMMUTABLE);
    res.type("image/jpeg");
    return res.send(out);
  } catch {
    return next();
  }
}
