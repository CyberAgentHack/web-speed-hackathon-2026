import * as fs from "node:fs";
import * as path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

// サーバー起動時に dist/index.html からクリティカルリソースのパスを抽出
const indexHtmlPath = path.join(CLIENT_DIST_PATH, "index.html");
const preloadLinkValues: string[] = [];
try {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  const seen = new Set<string>();
  // <link rel="stylesheet"> の href を抽出（属性順序・大小文字に依存しない）
  for (const m of indexHtml.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch?.[1];
    if (href && !seen.has(href)) {
      seen.add(href);
      preloadLinkValues.push(`<${href}>; rel=preload; as=style`);
    }
  }
} catch {
  // index.html が存在しない場合（開発時等）はスキップ
}

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// history() による URL 書き換え後に判定し、HTML レスポンス時のみ Link ヘッダーを付与
staticRouter.use((req, res, next) => {
  if (req.method === "GET" && req.url.endsWith(".html")) {
    for (const value of preloadLinkValues) {
      res.append("Link", value);
    }
  }
  next();
});

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

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (/\.[a-f0-9]{8,}\./.test(path.basename(filePath))) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);
