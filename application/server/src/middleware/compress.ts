import { Readable } from "node:stream";
import zlib from "node:zlib";

import type { MiddlewareHandler } from "hono";

const MIN_COMPRESS_SIZE = 1024;

// Already-compressed or binary formats where dynamic compression is wasteful
const SKIP_COMPRESS_TYPES = new Set([
  "font/woff2",
  "font/woff",
  "image/avif",
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/wasm",
]);

type Encoding = "br" | "gzip" | "deflate";

function negotiateEncoding(acceptEncoding: string): Encoding | null {
  // Priority: br > gzip > deflate
  if (acceptEncoding.includes("br")) return "br";
  if (acceptEncoding.includes("gzip")) return "gzip";
  if (acceptEncoding.includes("deflate")) return "deflate";
  return null;
}

function createCompressStream(encoding: Encoding): zlib.BrotliCompress | zlib.Gzip | zlib.Deflate {
  switch (encoding) {
    case "br":
      return zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
        },
      });
    case "gzip":
      return zlib.createGzip();
    case "deflate":
      return zlib.createDeflate();
  }
}

export function brotliCompress(): MiddlewareHandler {
  return async (c, next) => {
    await next();

    const res = c.res;

    // Skip if no response body
    if (!res.body) return;

    // Skip if already encoded
    if (res.headers.get("Content-Encoding")) return;

    // Skip SSE streams and already-compressed formats
    const contentType = res.headers.get("Content-Type");
    if (contentType?.includes("text/event-stream")) return;
    const baseType = contentType?.split(";")[0]?.trim();
    if (baseType && SKIP_COMPRESS_TYPES.has(baseType)) return;

    // Check Accept-Encoding
    const acceptEncoding = c.req.header("Accept-Encoding") ?? "";
    const encoding = negotiateEncoding(acceptEncoding);
    if (!encoding) return;

    // Check Content-Length for small responses
    const contentLength = res.headers.get("Content-Length");
    if (contentLength && parseInt(contentLength, 10) < MIN_COMPRESS_SIZE) return;

    // For responses without Content-Length, we need to read the body to check size
    // But for streaming responses, we compress regardless
    const body = res.body;

    const compressStream = createCompressStream(encoding);

    // Convert web ReadableStream to Node.js Readable, pipe through compression
    const nodeReadable = Readable.fromWeb(body as import("stream/web").ReadableStream);
    const compressed = nodeReadable.pipe(compressStream);

    // Build new headers
    const headers = new Headers(res.headers);
    headers.set("Content-Encoding", encoding);
    headers.set("Vary", "Accept-Encoding");
    headers.delete("Content-Length"); // Length changes after compression

    // Convert back to web ReadableStream
    const webStream = Readable.toWeb(compressed) as ReadableStream;

    c.res = new Response(webStream, {
      status: res.status,
      headers,
    });
  };
}
