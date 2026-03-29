import fs from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import termsHtml from "@web-speed-hackathon-2026/server/src/routes/terms-content.html";

export const staticRouter = Router();

/**
 * 利用規約ページを静的HTMLで返す。
 * JSの実行を待たずにコンテンツが表示されるためFCP/LCP/TBTが大幅に改善する。
 * Reactマウント後にSPAとして引き継がれる。
 */
staticRouter.get("/terms", (_req, res, next) => {
  const indexPath = path.resolve(CLIENT_DIST_PATH, "index.html");
  try {
    const indexHtml = fs.readFileSync(indexPath, "utf-8");
    // スケルトンUIの部分を利用規約のコンテンツに置換
    const marker = '<div id="app">';
    const idx = indexHtml.indexOf(marker);
    if (idx === -1) { next(); return; }
    const insertPos = idx + marker.length;
    // 既存のスケルトンHTMLの終端（</div></body>の直前の</div>）を探す
    const bodyEnd = indexHtml.indexOf('</body>');
    const lastDivEnd = indexHtml.lastIndexOf('</div>', bodyEnd);
    const html = indexHtml.slice(0, insertPos) + termsHtml + indexHtml.slice(lastDivEnd);
    res.type("text/html").send(html);
  } catch {
    next();
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
  }),
);
