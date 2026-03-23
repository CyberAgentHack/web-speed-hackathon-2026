import { existsSync } from "node:fs";
import path from "node:path";

import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = new Hono();

// Serve uploads
if (existsSync(UPLOAD_PATH)) {
  staticRouter.use(
    serveStatic({
      root: UPLOAD_PATH,
      rewriteRequestPath: (path) => path,
    }),
  );
}

// Serve public
staticRouter.use(
  serveStatic({
    root: PUBLIC_PATH,
    rewriteRequestPath: (path) => path,
  }),
);

// Serve client dist with SPA fallback
if (existsSync(CLIENT_DIST_PATH)) {
  staticRouter.use(
    serveStatic({
      root: CLIENT_DIST_PATH,
      rewriteRequestPath: (requestPath) => requestPath,
    }),
  );

  const serveClientIndex = serveStatic({
    root: CLIENT_DIST_PATH,
    path: "/index.html",
  });

  staticRouter.get("*", async (c, next) => {
    if (path.extname(c.req.path) !== "") {
      return c.notFound();
    }

    return serveClientIndex(c, next);
  });
}
