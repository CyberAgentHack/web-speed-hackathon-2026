import fs from "node:fs";
import history from "connect-history-api-fallback";
import path from "path";
import { Router } from "express";
import serveStatic, { ServeStaticOptions } from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { renderTermsPage } from "@web-speed-hackathon-2026/server/src/routes/terms_page";

export const staticRouter = Router();

// Terms page SSR: pre-render HTML to reduce client-side TBT
let termsHtmlCache: string | null = null;
staticRouter.get("/terms", (_req, res, next) => {
  try {
    if (termsHtmlCache === null) {
      const indexPath = path.resolve(CLIENT_DIST_PATH, "index.html");
      if (!fs.existsSync(indexPath)) {
        return next();
      }
      const baseHtml = fs.readFileSync(indexPath, "utf-8");
      termsHtmlCache = renderTermsPage(baseHtml);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.send(termsHtmlCache);
  } catch {
    next();
  }
});

const LONG_CACHE = "public, max-age=31536000, immutable";
const REVALIDATE_CACHE = "public, max-age=0, must-revalidate";
const HASHED_FILE = /chunk-[0-9a-f]+\.[^.]+$|[.-][0-9a-f]{8,}\.[^.]+$/i;
const UUID_FILE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[^.]+$/i;

type SetHeaders = NonNullable<ServeStaticOptions["setHeaders"]>;

function createSetHeaders(rootPath: string): SetHeaders {
  return (res, filePath) => {
    const rel = path.relative(rootPath, filePath);
    if (rel === "index.html") {
      res.setHeader("Cache-Control", REVALIDATE_CACHE);
    } else if (HASHED_FILE.test(rel) || UUID_FILE.test(rel)) {
      res.setHeader("Cache-Control", LONG_CACHE);
    } else {
      res.setHeader("Cache-Control", REVALIDATE_CACHE);
    }
  };
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: createSetHeaders(UPLOAD_PATH),
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: createSetHeaders(PUBLIC_PATH),
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: createSetHeaders(CLIENT_DIST_PATH),
  }),
);
