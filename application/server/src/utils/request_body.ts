import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";

import { HTTPException } from "hono/http-exception";

const MAX_BODY_SIZE = 10 * 1024 * 1024;

function decodeContent(buffer: Buffer, contentEncoding: string | null): Buffer {
  const encoding = contentEncoding?.trim().toLowerCase();

  if (encoding == null || encoding === "" || encoding === "identity") {
    return buffer;
  }

  try {
    switch (encoding) {
      case "gzip":
        return gunzipSync(buffer);
      case "deflate":
        return inflateSync(buffer);
      case "br":
        return brotliDecompressSync(buffer);
      default:
        throw new HTTPException(415, { message: "Unsupported Media Type" });
    }
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(400, { message: "Bad Request" });
  }
}

export async function readBinaryBody(request: Request): Promise<Buffer> {
  const rawBuffer = Buffer.from(await request.arrayBuffer());
  const buffer = decodeContent(rawBuffer, request.headers.get("content-encoding"));
  if (buffer.length > MAX_BODY_SIZE) {
    throw new HTTPException(413, { message: "Payload Too Large" });
  }
  return buffer;
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  const buffer = await readBinaryBody(request);

  try {
    return JSON.parse(buffer.toString("utf-8")) as T;
  } catch {
    throw new HTTPException(400, { message: "Bad Request" });
  }
}
