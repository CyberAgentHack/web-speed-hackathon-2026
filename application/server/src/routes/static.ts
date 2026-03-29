import history from "connect-history-api-fallback";
import fs from "fs";
import path from "path";
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const PRECOMPRESSED_EXTENSION_PATTERN = /\.(?:br|gz)$/;
const COMPRESSIBLE_ASSET_EXTENSION_PATTERN = /\.(?:css|html|js|json|map|svg|txt|xml)$/i;

function setCacheControl(res: Response, value: string) {
  res.setHeader("Cache-Control", value);
}

function setDistCacheHeaders(res: Response, filePath: string) {
  const normalizedFilePath = filePath.replace(PRECOMPRESSED_EXTENSION_PATTERN, "");
  const relativePath = path.relative(CLIENT_DIST_PATH, normalizedFilePath);
  const fileName = path.basename(normalizedFilePath);
  const isHashedAsset = /(?:^chunk-|-[0-9a-f]{8,}\.)/.test(fileName);

  if (relativePath === "index.html") {
    setCacheControl(res, "no-cache, no-transform");
    return;
  }

  if (isHashedAsset) {
    setCacheControl(res, `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable, no-transform`);
    return;
  }

  setCacheControl(res, "public, max-age=0, must-revalidate, no-transform");
}

function createPrecompressedStaticMiddleware(rootPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    const [pathname = "", search = ""] = req.url.split("?");
    if (!COMPRESSIBLE_ASSET_EXTENSION_PATTERN.test(pathname)) {
      next();
      return;
    }

    const acceptedEncodings = req.headers["accept-encoding"];
    if (typeof acceptedEncodings !== "string") {
      next();
      return;
    }

    const preferredEncoding = acceptedEncodings.includes("br")
      ? "br"
      : acceptedEncodings.includes("gzip")
        ? "gz"
        : null;

    if (preferredEncoding === null) {
      next();
      return;
    }

    const decodedPathname = decodeURIComponent(pathname);
    const relativePath = decodedPathname.replace(/^\/+/, "");
    const absolutePath = path.resolve(rootPath, relativePath);
    const normalizedRelativePath = path.relative(rootPath, absolutePath);
    if (
      normalizedRelativePath.startsWith("..") ||
      path.isAbsolute(normalizedRelativePath) ||
      !fs.existsSync(`${absolutePath}.${preferredEncoding}`)
    ) {
      next();
      return;
    }

    req.url = `${pathname}.${preferredEncoding}${search === "" ? "" : `?${search}`}`;
    res.setHeader("Content-Encoding", preferredEncoding === "br" ? "br" : "gzip");
    res.setHeader("Vary", "Accept-Encoding");
    res.type(path.extname(decodedPathname));

    next();
  };
}

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    immutable: true,
    maxAge: ONE_YEAR_IN_SECONDS * 1000,
    setHeaders: (res) => {
      setCacheControl(res, `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable, no-transform`);
    },
  }),
);

staticRouter.use(createPrecompressedStaticMiddleware(PUBLIC_PATH));
staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    maxAge: ONE_DAY_IN_SECONDS * 1000,
    setHeaders: (res) => {
      setCacheControl(res, `public, max-age=${ONE_DAY_IN_SECONDS}, no-transform`);
    },
  }),
);

staticRouter.use(createPrecompressedStaticMiddleware(CLIENT_DIST_PATH));
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setDistCacheHeaders,
  }),
);
