import { readdirSync } from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

// Build a set of pre-compressed file paths at startup
function buildCompressedFileSet(dir: string, ext: string): Set<string> {
  const result = new Set<string>();
  try {
    const walkDir = (d: string) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const fullPath = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name.endsWith(ext)) {
          result.add(fullPath);
        }
      }
    };
    walkDir(dir);
  } catch { /* dir may not exist at import time */ }
  return result;
}

const brFiles = buildCompressedFileSet(CLIENT_DIST_PATH, ".br");
const gzFiles = buildCompressedFileSet(CLIENT_DIST_PATH, ".gz");

export const staticRouter = Router();

// Pre-compressed file serving (Brotli/Gzip)
const COMPRESSIBLE = /\.(js|css|html|svg|json|txt|xml)$/;
staticRouter.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!COMPRESSIBLE.test(req.path)) return next();

  const accept = req.headers["accept-encoding"] || "";
  const filePath = path.join(CLIENT_DIST_PATH, req.path);

  if (accept.includes("br")) {
    const brPath = filePath + ".br";
    if (brFiles.has(brPath)) {
      res.setHeader("Content-Encoding", "br");
      res.setHeader("Vary", "Accept-Encoding");
      if (req.path.endsWith(".js")) res.setHeader("Content-Type", "application/javascript");
      else if (req.path.endsWith(".css")) res.setHeader("Content-Type", "text/css");
      else if (req.path.endsWith(".html")) res.setHeader("Content-Type", "text/html");
      else if (req.path.endsWith(".svg")) res.setHeader("Content-Type", "image/svg+xml");

      if (req.path.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
      return res.sendFile(brPath);
    }
  }

  if (accept.includes("gzip")) {
    const gzPath = filePath + ".gz";
    if (gzFiles.has(gzPath)) {
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Vary", "Accept-Encoding");
      if (req.path.endsWith(".js")) res.setHeader("Content-Type", "application/javascript");
      else if (req.path.endsWith(".css")) res.setHeader("Content-Type", "text/css");
      else if (req.path.endsWith(".html")) res.setHeader("Content-Type", "text/html");
      else if (req.path.endsWith(".svg")) res.setHeader("Content-Type", "image/svg+xml");

      if (req.path.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
      return res.sendFile(gzPath);
    }
  }

  next();
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);
