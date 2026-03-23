import { gunzip } from "node:zlib";
import { promisify } from "node:util";

import type { Context } from "hono";

const gunzipAsync = promisify(gunzip);

/**
 * Parse JSON from request body, handling gzip-encoded Content-Encoding.
 * Express's bodyParser handled this transparently; Hono does not.
 */
export async function parseJSON(c: Context): Promise<unknown> {
  const encoding = c.req.header("Content-Encoding");
  if (encoding?.includes("gzip")) {
    const raw = await c.req.arrayBuffer();
    const decompressed = await gunzipAsync(Buffer.from(raw));
    return JSON.parse(decompressed.toString("utf8"));
  }
  return c.req.json();
}
