import { promises as fs } from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// Chrome など WebP 対応ブラウザ向けに、同名の .webp があれば優先配信する
staticRouter.use(async (req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    return next();
  }
  if (!/^\/images\/.+\.jpg$/i.test(req.path)) {
    return next();
  }

  const accept = req.headers.accept;
  if (typeof accept !== "string" || !accept.includes("image/webp")) {
    return next();
  }

  const relativeJpgPath = req.path.replace(/^\/+/, "");
  const relativeWebpPath = relativeJpgPath.replace(/\.jpg$/i, ".webp");
  const candidates = [UPLOAD_PATH, PUBLIC_PATH].map((rootPath) => {
    const resolvedRoot = path.resolve(rootPath);
    const resolvedWebpPath = path.resolve(rootPath, relativeWebpPath);
    return { resolvedRoot, resolvedWebpPath };
  });

  for (const { resolvedRoot, resolvedWebpPath } of candidates) {
    // path traversal 防止
    if (
      resolvedWebpPath !== resolvedRoot &&
      !resolvedWebpPath.startsWith(`${resolvedRoot}${path.sep}`)
    ) {
      continue;
    }

    try {
      await fs.access(resolvedWebpPath);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(resolvedWebpPath, {
        headers: {
          "Content-Type": "image/webp",
        },
      });
    } catch {
      // 次の候補を試す
    }
  }

  return next();
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    immutable: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    immutable: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
        return;
      }

      if (/-[0-9a-f]{8,}\./i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  }),
);
