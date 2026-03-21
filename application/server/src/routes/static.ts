import fs from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

function loadSsgHtml(filename: string): string | null {
  const filePath = path.join(CLIENT_DIST_PATH, filename);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : null;
}

const ssgPages: Record<string, string | null> = {
  "/terms": loadSsgHtml("terms.html"),
  "/": loadSsgHtml("home.html"),
};

export const staticRouter = Router();

for (const [routePath, html] of Object.entries(ssgPages)) {
  if (html !== null) {
    staticRouter.get(routePath, (_req, res) => {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.send(html);
    });
  }
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: 86400000,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (/\.(otf|woff2?|ttf|eot)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (/-[0-9a-f]{16,}\.(js|css)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);
