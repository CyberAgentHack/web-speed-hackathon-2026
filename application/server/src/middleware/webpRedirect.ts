import fs from "node:fs";
import path from "node:path";
import { Request, RequestHandler } from "express";

type CacheEntry = "exists" | "missing";

const lookupCache = new Map<string, CacheEntry>();
const MAX_CACHE = 500;

function remember(key: string, value: CacheEntry) {
  lookupCache.set(key, value);
  if (lookupCache.size > MAX_CACHE) {
    const firstKey = lookupCache.keys().next().value;
    lookupCache.delete(firstKey);
  }
}

function acceptsWebp(req: Request): boolean {
  const accept = req.headers["accept"];
  return typeof accept === "string" && accept.includes("image/webp");
}

export function redirectToWebp(rootDir: string): RequestHandler {
  return (req, res, next) => {
    if (!acceptsWebp(req)) {
      return next();
    }
    const originalPath = req.path;
    if (!originalPath.endsWith(".jpg") && !originalPath.endsWith(".png")) {
      return next();
    }

    const webpPath = originalPath.replace(/\.(jpg|png)$/i, ".webp");
    const absolute = path.join(rootDir, webpPath);

    const cacheValue = lookupCache.get(absolute);
    if (cacheValue === "missing") {
      return next();
    }
    if (cacheValue === "exists") {
      req.url = webpPath;
      return next();
    }

    if (fs.existsSync(absolute)) {
      remember(absolute, "exists");
      req.url = webpPath;
    } else {
      remember(absolute, "missing");
    }
    return next();
  };
}
