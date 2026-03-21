import { readFile } from "node:fs/promises";
import path from "path";

import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticApp = new Hono();

// Convert absolute paths to relative paths (required by serveStatic)
const uploadRoot = path.relative(process.cwd(), UPLOAD_PATH);
const publicRoot = path.relative(process.cwd(), PUBLIC_PATH);
const distRoot = path.relative(process.cwd(), CLIENT_DIST_PATH);

// Serve uploaded files (images, movies, sounds)
staticApp.use(
  "*",
  serveStatic({
    root: uploadRoot,
    onFound: (_path, c) => {
      c.header("Cache-Control", "public, max-age=86400");
    },
  }),
);

// Serve public assets
staticApp.use(
  "*",
  serveStatic({
    root: publicRoot,
    onFound: (_path, c) => {
      c.header("Cache-Control", "public, max-age=86400");
    },
  }),
);

// Serve client dist (built JS/CSS/assets)
staticApp.use(
  "*",
  serveStatic({
    root: distRoot,
    onFound: (filePath, c) => {
      // Long-term cache for hashed files
      if (/\.[a-f0-9]{8,}\.(js|css|wasm|woff2?|ttf|otf)$/.test(filePath)) {
        c.header("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// Home page: inject initial posts data to eliminate API round-trip for LCP
const indexHtmlPath = path.join(CLIENT_DIST_PATH, "index.html");
staticApp.get("/", async (c) => {
  const [html, posts] = await Promise.all([
    readFile(indexHtmlPath, "utf8"),
    Post.findAll({ limit: 30, offset: 0 }),
  ]);
  const postsJson = JSON.stringify(posts.map((p) => p.toJSON()));
  const injected = html.replace(
    "</head>",
    `<script>window.__INITIAL_POSTS__=${postsJson}</script></head>`,
  );
  return c.html(injected, 200);
});

// SPA fallback: serve index.html for all non-file routes
staticApp.use("*", serveStatic({ path: "index.html", root: distRoot }));
