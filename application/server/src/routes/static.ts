import { readFile } from "node:fs/promises";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { renderAppShell } from "@web-speed-hackathon-2026/server/src/ssr";

export const staticRouter = Router();

let indexTemplateCache: string | null = null;

async function getIndexTemplate(): Promise<string> {
  if (indexTemplateCache == null) {
    indexTemplateCache = await readFile(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");
  }

  return indexTemplateCache;
}

const IMMUTABLE_EXTENSIONS = new Set([
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".webm",
  ".mp4",
  ".mp3",
  ".wav",
  ".ogg",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
]);

function setStaticCacheHeaders(
  res: Parameters<NonNullable<serveStatic.ServeStaticOptions["setHeaders"]>>[0],
  filePath: string,
): void {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".html") {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  if (IMMUTABLE_EXTENSIONS.has(extension)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.get(/.*/, async (req, res, next) => {
  if (path.extname(req.path) !== "") {
    return next();
  }

  if (req.accepts("html") !== "html") {
    return next();
  }

  try {
    const template = await getIndexTemplate();
    const appHtml = renderAppShell(req.path);
    const html = template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch {
    return next();
  }
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setStaticCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setStaticCacheHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
    setHeaders: setStaticCacheHeaders,
  }),
);
