import path from "path";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
  }),
);

// URL → HTML ファイルの明示的マッピング（SPA history fallback の代替）
const exactRoutes: Record<string, string> = {
  "/": "index.html",
  "/search": "search.html",
  "/dm": "dm-list.html",
  "/crok": "crok.html",
  "/terms": "terms.html",
};

const patternRoutes: Array<{ pattern: RegExp; file: string }> = [
  { pattern: /^\/posts\/[^/]+$/, file: "post-detail.html" },
  { pattern: /^\/users\/[^/]+$/, file: "user-profile.html" },
  { pattern: /^\/dm\/[^/]+$/, file: "dm.html" },
];

staticRouter.use((req, res, next) => {
  if (req.method !== "GET" || req.path.includes(".")) return next();

  const exactFile = exactRoutes[req.path];
  if (exactFile) {
    return res.sendFile(path.join(CLIENT_DIST_PATH, exactFile));
  }

  for (const { pattern, file } of patternRoutes) {
    if (pattern.test(req.path)) {
      return res.sendFile(path.join(CLIENT_DIST_PATH, file));
    }
  }

  res.status(404).sendFile(path.join(CLIENT_DIST_PATH, "not-found.html"));
});

