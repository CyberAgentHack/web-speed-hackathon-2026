import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// Serve uploaded files and public assets first
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
  }),
);

// Serve non-HTML static assets from client dist (JS, CSS, fonts, etc.)
// Use index: false to prevent serving index.html for "/" — we handle that below
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// Read the HTML template — cache in production, reload every request in development
let htmlTemplate: string | null = null;
function getHtmlTemplate(): string | null {
  if (process.env["NODE_ENV"] === "production" && htmlTemplate != null) {
    return htmlTemplate;
  }
  try {
    htmlTemplate = fs.readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");
    return htmlTemplate;
  } catch {
    return null;
  }
}

// SPA fallback: serve index.html with injected initial data for all page routes
staticRouter.use(async (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  // Skip API routes (handled by apiRouter before staticRouter)
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Skip requests that have file extensions (real static files that weren't found)
  if (req.path !== "/" && /\.\w+$/.test(req.path)) {
    return next();
  }

  const html = getHtmlTemplate();
  if (html == null) {
    return next();
  }

  const initialData: Record<string, unknown> = {};
  const preloadLinks: string[] = [];

  try {
    const { Post } = await import("@web-speed-hackathon-2026/server/src/models");
    const { computeWaveform } =
      await import("@web-speed-hackathon-2026/server/src/routes/api/sound");

    // For the home route, inline the first page of posts
    if (req.path === "/" || req.path === "/index.html") {
      const posts = await Post.findAll({
        limit: 30,
        offset: 0,
      });

      const postsJson = posts.map((p) => p.toJSON());

      await Promise.all(
        postsJson.map(async (post) => {
          const sound = (post as Record<string, unknown>)["sound"] as
            | { id: string }
            | null
            | undefined;
          if (sound) {
            try {
              (sound as Record<string, unknown>)["waveform"] = await computeWaveform(sound.id);
            } catch {
              // skip if waveform computation fails
            }
          }
        }),
      );

      initialData["/api/v1/posts?limit=30&offset=0"] = postsJson;

      // Find the first post with images for LCP preload
      for (const post of postsJson) {
        const images = (post as Record<string, unknown>)["images"] as
          | Array<{ id: string }>
          | undefined;
        if (images && images.length > 0) {
          const firstImageId = images[0]!.id;
          preloadLinks.push(
            `<link rel="preload" as="image" href="/images/${firstImageId}.webp" fetchpriority="high">`,
          );
          break;
        }
      }
    }
  } catch {
    // If data fetch fails, serve HTML without initial data
  }

  let injectedHtml = html;

  // Inject preload links
  if (preloadLinks.length > 0) {
    injectedHtml = injectedHtml.replace("</head>", `${preloadLinks.join("\n")}\n</head>`);
  }

  // Inject initial data
  if (Object.keys(initialData).length > 0) {
    const script = `<script>window.__INITIAL_DATA__=${JSON.stringify(initialData)}</script>`;
    injectedHtml = injectedHtml.replace("</head>", `${script}\n</head>`);
  }

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache");
  res.send(injectedHtml);
});
