import { brotliCompressSync, constants, gzipSync } from "node:zlib";

import type { NextFunction, Request, Response } from "express";

const MIN_COMPRESS_SIZE = 1024;
const COMPRESSIBLE_CONTENT_TYPE =
  /^(text\/|application\/(javascript|json|xml|xhtml\+xml)|image\/svg\+xml)/i;

function appendVaryHeader(res: Response, value: string) {
  const current = res.getHeader("Vary");
  if (typeof current !== "string" || current.length === 0) {
    res.setHeader("Vary", value);
    return;
  }

  if (!current.split(",").map((token) => token.trim().toLowerCase()).includes(value.toLowerCase())) {
    res.setHeader("Vary", `${current}, ${value}`);
  }
}

function toBuffer(chunk: unknown, encoding?: BufferEncoding): Buffer {
  if (chunk == null) {
    return Buffer.alloc(0);
  }
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }
  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk);
  }
  return Buffer.from(String(chunk), encoding);
}

function selectEncoding(acceptEncoding: string): "br" | "gzip" | null {
  const normalized = acceptEncoding.toLowerCase();
  if (normalized.includes("br")) {
    return "br";
  }
  if (normalized.includes("gzip")) {
    return "gzip";
  }
  return null;
}

function shouldCompressResponse(req: Request, res: Response): boolean {
  if (req.method === "HEAD") {
    return false;
  }

  if (res.statusCode < 200 || res.statusCode === 204 || res.statusCode === 304) {
    return false;
  }

  if (res.getHeader("Content-Encoding") != null) {
    return false;
  }

  const contentType = String(res.getHeader("Content-Type") ?? "");
  if (!COMPRESSIBLE_CONTENT_TYPE.test(contentType)) {
    return false;
  }

  if (contentType.includes("text/event-stream")) {
    return false;
  }

  const cacheControl = String(res.getHeader("Cache-Control") ?? "");
  if (cacheControl.includes("no-transform")) {
    return false;
  }

  return true;
}

function compressBuffer(buffer: Buffer, encoding: "br" | "gzip"): Buffer {
  if (encoding === "br") {
    return brotliCompressSync(buffer, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: 4,
      },
    });
  }

  return gzipSync(buffer, {
    level: 6,
  });
}

function normalizeEncoding(encoding?: BufferEncoding): BufferEncoding {
  return encoding ?? "utf8";
}

export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = typeof req.headers["accept-encoding"] === "string"
    ? req.headers["accept-encoding"]
    : "";
  const selectedEncoding = selectEncoding(acceptEncoding);

  if (selectedEncoding == null) {
    next();
    return;
  }

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  let shouldBuffer = true;
  let chunks: Buffer[] = [];

  const flushUncompressed = () => {
    if (!shouldBuffer) {
      return;
    }

    shouldBuffer = false;
    for (const chunk of chunks) {
      originalWrite(chunk);
    }
    chunks = [];
  };

  res.write = ((chunk: unknown, encoding?: BufferEncoding, callback?: (error?: Error | null) => void) => {
    if (!shouldBuffer) {
      return originalWrite(chunk as never, normalizeEncoding(encoding), callback);
    }

    if (!shouldCompressResponse(req, res)) {
      flushUncompressed();
      return originalWrite(chunk as never, normalizeEncoding(encoding), callback);
    }

    chunks.push(toBuffer(chunk, encoding));
    callback?.();
    return true;
  }) as typeof res.write;

  res.end = ((chunk?: unknown, encoding?: BufferEncoding, callback?: () => void) => {
    if (!shouldBuffer) {
      if (chunk == null) {
        return originalEnd(callback);
      }
      return originalEnd(chunk as never, normalizeEncoding(encoding), callback);
    }

    if (chunk != null) {
      chunks.push(toBuffer(chunk, encoding));
    }

    if (!shouldCompressResponse(req, res)) {
      flushUncompressed();
      return originalEnd(callback);
    }

    const body = Buffer.concat(chunks);
    shouldBuffer = false;
    chunks = [];

    if (body.length < MIN_COMPRESS_SIZE) {
      return originalEnd(body, callback);
    }

    const compressed = compressBuffer(body, selectedEncoding);
    if (compressed.length >= body.length) {
      return originalEnd(body, callback);
    }

    appendVaryHeader(res, "Accept-Encoding");
    res.removeHeader("Content-Length");
    res.setHeader("Content-Encoding", selectedEncoding);
    res.setHeader("Content-Length", String(compressed.length));

    return originalEnd(compressed, callback);
  }) as typeof res.end;

  next();
}
