import { promises as fs } from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";
import sharp from "sharp";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// 画像を WebP に変換し、w/h クエリがあればリサイズして配信する
staticRouter.use(async (req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    return next();
  }
  if (!/^\/images\/.+\.jpg$/i.test(req.path)) {
    return next();
  }

  const accept = req.headers.accept;
  const supportsWebp = typeof accept === "string" && accept.includes("image/webp");

  const qw = parseInt(req.query["w"] as string, 10);
  const qh = parseInt(req.query["h"] as string, 10);
  const width = Number.isFinite(qw) && qw > 0 ? qw : undefined;
  const height = Number.isFinite(qh) && qh > 0 ? qh : undefined;

  const wantsTransform = supportsWebp || width !== undefined || height !== undefined;
  if (!wantsTransform) {
    return next();
  }

  const relativeJpgPath = req.path.replace(/^\/+/, "");
  const candidates = [UPLOAD_PATH, PUBLIC_PATH].map((rootPath) => {
    const resolvedRoot = path.resolve(rootPath);
    const resolvedJpgPath = path.resolve(rootPath, relativeJpgPath);
    return { resolvedRoot, resolvedJpgPath };
  });

  for (const { resolvedRoot, resolvedJpgPath } of candidates) {
    // path traversal 防止
    if (
      resolvedJpgPath !== resolvedRoot &&
      !resolvedJpgPath.startsWith(`${resolvedRoot}${path.sep}`)
    ) {
      continue;
    }

    try {
      await fs.access(resolvedJpgPath);

      let pipeline = sharp(resolvedJpgPath);
      if (width !== undefined || height !== undefined) {
        pipeline = pipeline.resize(width, height, { fit: "cover" });
      }
      if (supportsWebp) {
        pipeline = pipeline.webp({ quality: 80 });
      } else {
        pipeline = pipeline.jpeg({ quality: 85 });
      }

      const buffer = await pipeline.toBuffer();
      const contentType = supportsWebp ? "image/webp" : "image/jpeg";

      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
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
