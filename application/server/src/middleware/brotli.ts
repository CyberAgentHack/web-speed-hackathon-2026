import fs from "node:fs";
import path from "node:path";

import type { RequestHandler } from "express";

const BROTLI_COMPRESSIBLE_EXTENSIONS = new Set([
  ".js",
  ".css",
  ".html",
  ".svg",
]);

function resolveSafePath(rootPath: string, requestPath: string): string | null {
  const decodedPath = decodeURIComponent(requestPath);
  const normalizedPath = decodedPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(rootPath, normalizedPath);

  if (
    absolutePath === rootPath ||
    absolutePath.startsWith(`${rootPath}${path.sep}`)
  ) {
    return absolutePath;
  }

  return null;
}

export function precompressedBrotli(rootPath: string): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    if (!req.acceptsEncodings("br")) {
      return next();
    }

    const extension = path.extname(req.path);

    if (!BROTLI_COMPRESSIBLE_EXTENSIONS.has(extension)) {
      return next();
    }

    const originalFilePath = resolveSafePath(rootPath, req.path);

    if (originalFilePath === null) {
      return next();
    }

    const brotliFilePath = `${originalFilePath}.br`;

    if (!fs.existsSync(brotliFilePath)) {
      return next();
    }

    res.setHeader("Content-Encoding", "br");
    res.setHeader("Vary", "Accept-Encoding");
    res.type(extension);

    return res.sendFile(brotliFilePath);
  };
}
