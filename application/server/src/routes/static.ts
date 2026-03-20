import { existsSync } from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

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
    if (existsSync(brPath)) {
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
    if (existsSync(gzPath)) {
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
