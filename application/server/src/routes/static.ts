import { promises as fsp } from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { type Request, type Response, type NextFunction, Router } from "express";
import serveStatic from "serve-static";

import { imageOptimizeRouter } from "@web-speed-hackathon-2026/server/src/routes/image_optimize";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

/** Serve pre-compressed .br / .gz files for JS and CSS assets */
function servePreCompressed(rootDir: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only handle JS and CSS static files
    if (!/\.(js|css)(\?.*)?$/.test(req.path)) {
      return next();
    }

    const cleanPath = req.path.split("?")[0]!;
    const acceptEncoding = req.headers["accept-encoding"] ?? "";
    const ext = path.extname(cleanPath);
    const contentType = ext === ".js" ? "application/javascript" : "text/css";

    const setImmutableHeaders = (encoding: string) => {
      res.setHeader("Content-Encoding", encoding);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    };

    if (acceptEncoding.includes("br")) {
      const brPath = path.join(rootDir, cleanPath + ".br");
      try {
        await fsp.access(brPath);
        setImmutableHeaders("br");
        res.sendFile(brPath);
        return;
      } catch {
        // .br file not found, try gzip
      }
    }

    if (acceptEncoding.includes("gzip")) {
      const gzPath = path.join(rootDir, cleanPath + ".gz");
      try {
        await fsp.access(gzPath);
        setImmutableHeaders("gzip");
        res.sendFile(gzPath);
        return;
      } catch {
        // .gz file not found, fall through to serve-static
      }
    }

    // No pre-compressed file: serve uncompressed with immutable caching
    // (serve-static will handle the actual file; just set cache header)
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    next();
  };
}

// 画像は WebP リサイズ配信（SPA フォールバックより前に処理する）
staticRouter.use(imageOptimizeRouter);

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
  }),
);

// Pre-compressed brotli/gzip serving + immutable caching for hashed JS/CSS
staticRouter.use(servePreCompressed(CLIENT_DIST_PATH));

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
  }),
);
