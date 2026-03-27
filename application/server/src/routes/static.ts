import fs from "node:fs/promises";
import path from "path";

import { Hono } from "hono";
import type { Context } from "hono";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";

export const staticRouter = new Hono<Env>();

const STATIC_DIRS = [
  { root: UPLOAD_PATH, maxAge: 604800, immutable: false },
  { root: PUBLIC_PATH, maxAge: 604800, immutable: false },
  { root: CLIENT_DIST_PATH, maxAge: 604800, immutable: true },
];

function toETag(stats: Awaited<ReturnType<typeof fs.stat>>): string {
  const modifiedAt =
    typeof stats.mtimeMs === "bigint" ? stats.mtimeMs : BigInt(Math.floor(stats.mtimeMs));
  return `W/"${stats.size.toString(16)}-${modifiedAt.toString(16)}"`;
}

function isNotModified(c: Context<Env>, etag: string, lastModified: string): boolean {
  const ifNoneMatch = c.req.header("if-none-match");
  if (ifNoneMatch != null) {
    const etags = ifNoneMatch.split(",").map((value: string) => value.trim());
    return etags.includes(etag) || etags.includes("*");
  }

  const ifModifiedSince = c.req.header("if-modified-since");
  if (ifModifiedSince == null) {
    return false;
  }

  const modifiedSince = new Date(ifModifiedSince);
  const lastModifiedAt = new Date(lastModified);
  if (Number.isNaN(modifiedSince.getTime()) || Number.isNaN(lastModifiedAt.getTime())) {
    return false;
  }

  return lastModifiedAt <= modifiedSince;
}

function acceptsHtml(acceptHeader: string | undefined): boolean {
  if (acceptHeader == null) {
    return false;
  }

  return acceptHeader
    .split(",")
    .map((value: string) => value.trim())
    .some((value: string) => value.includes("text/html") || value.includes("*/*"));
}

staticRouter.on(["GET", "HEAD"], "*", async (c) => {
  const urlPath = new URL(c.req.url).pathname;

  for (const { root, maxAge, immutable } of STATIC_DIRS) {
    const filePath = path.resolve(root, `.${urlPath}`);
    const relativePath = path.relative(root, filePath);

    // Prevent directory traversal and sibling-directory escapes.
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) continue;

    const file = Bun.file(filePath);
    if (await file.exists()) {
      const stats = await fs.stat(filePath);
      const etag = toETag(stats);
      const lastModified = stats.mtime.toUTCString();
      let cacheControl: string;
      if (filePath.endsWith(".html")) {
        cacheControl = "no-cache";
      } else if (immutable) {
        cacheControl = `public, max-age=${maxAge}, immutable`;
      } else {
        cacheControl = `public, max-age=${maxAge}`;
      }

      if (isNotModified(c, etag, lastModified)) {
        return new Response(null, {
          status: 304,
          headers: {
            "Cache-Control": cacheControl,
            ETag: etag,
            "Last-Modified": lastModified,
          },
        });
      }

      return new Response(file, {
        headers: {
          "Cache-Control": cacheControl,
          ETag: etag,
          "Last-Modified": lastModified,
        },
      });
    }
  }

  if (urlPath.startsWith("/api/")) {
    return c.notFound();
  }

  // SPA fallback only for routes without a file extension.
  if (path.extname(urlPath) !== "") {
    return c.notFound();
  }

  if (!acceptsHtml(c.req.header("accept"))) {
    return c.notFound();
  }

  const indexPath = path.join(CLIENT_DIST_PATH, "index.html");
  const indexFile = Bun.file(indexPath);
  const stats = await fs.stat(indexPath);
  const etag = toETag(stats);
  const lastModified = stats.mtime.toUTCString();

  if (isNotModified(c, etag, lastModified)) {
    return new Response(null, {
      status: 304,
      headers: {
        "Cache-Control": "no-cache",
        ETag: etag,
        "Last-Modified": lastModified,
      },
    });
  }

  return new Response(indexFile, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      ETag: etag,
      "Last-Modified": lastModified,
    },
  });
});
