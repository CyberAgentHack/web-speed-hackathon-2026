import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

const execFileAsync = promisify(execFile);

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const COMPRESSIBLE_EXTS = new Set([".js", ".css"]);
const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function precompressedMiddleware(root: string) {
  return (req: any, res: any, next: () => void) => {
    const ext = path.extname(req.path);
    if (!COMPRESSIBLE_EXTS.has(ext)) return next();

    const accept = (req.headers["accept-encoding"] ?? "") as string;
    const candidates: Array<{ suffix: string; encoding: string }> = [];
    if (accept.includes("br")) candidates.push({ suffix: ".br", encoding: "br" });
    if (accept.includes("gzip")) candidates.push({ suffix: ".gz", encoding: "gzip" });

    for (const { suffix, encoding } of candidates) {
      const filePath = path.join(root, req.path + suffix);
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Encoding", encoding);
        res.setHeader("Content-Type", MIME_TYPES[ext]);
        res.setHeader("Vary", "Accept-Encoding");
        return res.sendFile(filePath);
      }
    }
    next();
  };
}

// WebP 変換ジョブの重複防止 Map
const webpJobs = new Map<string, Promise<string | null>>();

async function convertToWebP(src: string, dst: string): Promise<string | null> {
  if (!webpJobs.has(dst)) {
    const job = execFileAsync("ffmpeg", [
      "-y", "-i", src,
      "-vf", "scale=min(1200\\,iw):-2",
      "-c:v", "libwebp", "-quality", "80",
      dst,
    ])
      .then(() => dst)
      .catch(() => null)
      .finally(() => webpJobs.delete(dst));
    webpJobs.set(dst, job);
  }
  return webpJobs.get(dst)!;
}

// メディアファイルは UUID ベースで不変 → 長期キャッシュ
staticRouter.use("/movies/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/images/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});

// Accept: image/webp のリクエストに対して WebP をオンデマンド変換して返す
staticRouter.use("/images/", async (req: any, res: any, next: () => void) => {
  const accept = (req.headers["accept"] ?? "") as string;
  if (!accept.includes("image/webp") || !req.path.endsWith(".jpg")) {
    return next();
  }

  const rel = req.path; // 例: /85946f86...jpg  または  /profiles/xxx.jpg
  const webpRel = rel.replace(/\.jpg$/, ".webp");

  for (const root of [PUBLIC_PATH, UPLOAD_PATH]) {
    const src = path.join(root, "images", rel);
    const dst = path.join(root, "images", webpRel);

    // WebP キャッシュが存在すれば即座に返す
    const webpExists = await fs.promises.access(dst).then(() => true).catch(() => false);
    if (webpExists) {
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Vary", "Accept");
      return res.sendFile(dst);
    }

    // ソース JPG が存在するか確認
    const srcExists = await fs.promises.access(src).then(() => true).catch(() => false);
    if (!srcExists) continue;

    // オンデマンド変換（初回のみ、以降はキャッシュ）
    const result = await convertToWebP(src, dst);
    if (result) {
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Vary", "Accept");
      return res.sendFile(result);
    }
  }

  return next();
});
staticRouter.use("/sounds/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});

// コンテンツハッシュ付きの不変アセットは長期キャッシュ
staticRouter.use("/scripts/chunk-", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/assets/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/styles/fonts/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});
staticRouter.use("/fonts/", (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return next();
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

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

staticRouter.use(precompressedMiddleware(CLIENT_DIST_PATH));
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
  }),
);
