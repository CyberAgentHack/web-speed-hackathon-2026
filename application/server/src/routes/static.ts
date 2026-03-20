import fs from "node:fs";
import path from "node:path";

import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

export const staticRouter = new Hono<SessionEnv>();

// Uploaded content (images etc.) - cache for 1 day
staticRouter.use(
  "/upload/*",
  serveStatic({
    root: path.relative(process.cwd(), UPLOAD_PATH),
    rewriteRequestPath: (p) => p.replace(/^\/upload/, ""),
    onFound: (_path, c) => {
      if (_path.endsWith(".html")) {
        c.header("Cache-Control", "no-cache");
      } else {
        c.header("Cache-Control", "public, max-age=86400");
      }
    },
  }),
);

// Public assets (images, fonts, etc.) - cache for 1 day
staticRouter.use(
  "/*",
  serveStatic({
    root: path.relative(process.cwd(), PUBLIC_PATH),
    onFound: (_path, c) => {
      if (_path.endsWith(".html")) {
        c.header("Cache-Control", "no-cache");
      } else {
        c.header("Cache-Control", "public, max-age=86400");
      }
    },
  }),
);

// MIME type lookup for pre-compressed files
const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// Middleware that serves pre-compressed (.br / .gz) files for hashed dist assets
const preCompressedStatic = createMiddleware(async (c, next) => {
  // Extract the file path relative to dist dir
  const requestPath = c.req.path; // e.g. /scripts/chunk-abc123.js
  const filePath = path.join(CLIENT_DIST_PATH, requestPath);

  // Check if original file exists
  if (!fs.existsSync(filePath)) {
    await next();
    return;
  }

  const acceptEncoding = c.req.header("Accept-Encoding") || "";
  const mimeType = getMimeType(filePath);

  // Set common headers
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  c.header("Vary", "Accept-Encoding");

  // Try Brotli first
  if (acceptEncoding.includes("br")) {
    const brPath = filePath + ".br";
    if (fs.existsSync(brPath)) {
      const body = fs.readFileSync(brPath);
      c.header("Content-Encoding", "br");
      c.header("Content-Type", mimeType);
      c.header("Content-Length", String(body.length));
      return c.body(body);
    }
  }

  // Try Gzip
  if (acceptEncoding.includes("gzip")) {
    const gzPath = filePath + ".gz";
    if (fs.existsSync(gzPath)) {
      const body = fs.readFileSync(gzPath);
      c.header("Content-Encoding", "gzip");
      c.header("Content-Type", mimeType);
      c.header("Content-Length", String(body.length));
      return c.body(body);
    }
  }

  // Serve original file
  const body = fs.readFileSync(filePath);
  c.header("Content-Type", mimeType);
  c.header("Content-Length", String(body.length));
  return c.body(body);
});

// Client dist (JS/CSS with content hashes) - served with pre-compression support
staticRouter.use("/scripts/*", preCompressedStatic);
staticRouter.use("/assets/*", preCompressedStatic);
