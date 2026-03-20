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
// index.html は SSR ルーターで処理するので /scripts と /assets のみ配信
const distStatic = serveStatic({
  root: path.relative(process.cwd(), CLIENT_DIST_PATH),
  onFound: (_path, c) => {
    c.header("Cache-Control", "public, max-age=31536000, immutable");
  },
});
staticRouter.use("/scripts/*", distStatic);
staticRouter.use("/assets/*", distStatic);
