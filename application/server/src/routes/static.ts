import type { ServerResponse } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

async function resolveFirstExistingPath(paths: string[]) {
  for (const filePath of paths) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      continue;
    }
  }

  return null;
}

async function resolveImagePath({
  acceptHeader,
  relativePath,
}: {
  acceptHeader: string | undefined;
  relativePath: string;
}) {
  const prefersAvif = acceptHeader?.includes("image/avif") ?? false;
  const extensions = prefersAvif ? ["avif", "jpg"] : ["jpg", "avif"];

  return await resolveFirstExistingPath([
    ...extensions.map((extension) => path.resolve(UPLOAD_PATH, `${relativePath}.${extension}`)),
    ...extensions.map((extension) => path.resolve(PUBLIC_PATH, `${relativePath}.${extension}`)),
  ]);
}

function setStaticHeaders(res: ServerResponse, filePath: string) {
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  if (filePath.startsWith(path.join(CLIENT_DIST_PATH, "scripts")) || filePath.startsWith(path.join(CLIENT_DIST_PATH, "styles"))) {
    res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
    return;
  }

  if (filePath.startsWith(UPLOAD_PATH) || filePath.endsWith(".avif")) {
    res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=3600");
}

staticRouter.get("/images/profiles/:profileImageId", async (req, res, next) => {
  const filePath = await resolveImagePath({
    acceptHeader: req.headers.accept,
    relativePath: `images/profiles/${req.params.profileImageId}`,
  });

  if (filePath == null) {
    next();
    return;
  }

  res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  res.sendFile(filePath);
});

staticRouter.get("/images/:imageId", async (req, res, next) => {
  const filePath = await resolveImagePath({
    acceptHeader: req.headers.accept,
    relativePath: `images/${req.params.imageId}`,
  });

  if (filePath == null) {
    next();
    return;
  }

  res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  res.sendFile(filePath);
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: setStaticHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: setStaticHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setStaticHeaders,
  }),
);
