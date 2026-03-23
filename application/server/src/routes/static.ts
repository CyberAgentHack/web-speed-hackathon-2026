import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// 1. UPLOAD_PATH (Uploaded images/videos)
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: (res, path) => {
      if (path.includes("/images/") || path.includes("/movies/") || path.includes("/sounds/")) {
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
      }
    },
  }),
);

// 2. PUBLIC_PATH (Static assets like profile images)
// Intercept for resizing profile images dynamically
staticRouter.get("/images/profiles/:id.webp", async (req, res, next) => {
  const w = req.query["w"];
  if (!w || typeof w !== "string" || isNaN(Number(w))) {
    return next();
  }
  
  try {
    const width = parseInt(w as string, 10);
    const filePath = path.join(PUBLIC_PATH, "images", "profiles", `${req.params.id}.webp`);
    
    await fs.access(filePath);
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=86400");
    
    const resized = await sharp(filePath).resize({ width, height: width }).webp().toBuffer();
    return res.end(resized);
  } catch (err) {
    next();
  }
});

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: (res, path) => {
      if (path.includes("/images/")) {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  }),
);

// 3. SPA 対応のため、ファイルが存在しないときに index.html を返すようにリライト
staticRouter.use(history());

// 4. CLIENT_DIST_PATH (Compiled JS/CSS)
staticRouter.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }
  
  if (req.url.match(/\.(js|css)$/) && req.acceptsEncodings('br')) {
    const originalUrl = req.url;
    req.url = req.url + '.br';
    res.setHeader('Content-Encoding', 'br');
    
    if (originalUrl.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (originalUrl.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
  }
  next();
});
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    index: false,
    setHeaders: (res, path) => {
      // Hashed assets (scripts and styles)
      if (path.match(/\.[a-f0-9]{20}\.(js|css)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    },
  }),
);
