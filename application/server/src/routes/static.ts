import { promises as fs } from "fs";
import path from "path";

import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

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

// Client dist (JS/CSS with content hashes) - cache immutably for 1 year
// index.html の自動返却は無効（SPA fallback で処理する）
staticRouter.use(
  "/*",
  serveStatic({
    root: path.relative(process.cwd(), CLIENT_DIST_PATH),
    onFound: (_path, c) => {
      if (_path.endsWith(".html")) {
        c.header("Cache-Control", "no-cache");
      } else {
        c.header("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// SPA fallback: serve index.html for non-file, non-API GET requests accepting HTML
staticRouter.get("*", async (c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.notFound();
  }
  if (c.req.path.includes(".")) {
    return c.notFound();
  }
  const accept = c.req.header("accept") ?? "";
  if (!accept.includes("text/html")) {
    return c.notFound();
  }

  const indexPath = path.join(CLIENT_DIST_PATH, "index.html");
  try {
    const html = await fs.readFile(indexPath, "utf-8");
    c.header("Cache-Control", "no-cache");
    return c.html(html);
  } catch {
    return c.notFound();
  }
});
