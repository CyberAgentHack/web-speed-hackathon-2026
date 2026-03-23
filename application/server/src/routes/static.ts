import { createRequire } from "module";
import { readFileSync, watch } from "node:fs";
import { PassThrough, type Writable } from "node:stream";
import path from "path";

import history from "connect-history-api-fallback";
import { type Request, type Response, type NextFunction, Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { Post } from "@web-speed-hackathon-2026/server/src/models";

export const staticRouter = Router();

// SSR バンドルをロード（ビルド済みの場合のみ）
const _require = createRequire(import.meta.url);

type SSRRender = (
  url: string,
  ssrData: Record<string, unknown[]>,
  onShellReady: (pipe: (dest: Writable) => void) => void,
  onError: (err: unknown) => void,
) => void;

let ssrRender: SSRRender | null = null;

try {
  const ssrBundle = _require(path.join(CLIENT_DIST_PATH, "ssr-bundle.cjs")) as {
    render: SSRRender;
  };
  ssrRender = ssrBundle.render;
  console.log("[SSR] バンドル読み込み完了");
} catch {
  console.log("[SSR] バンドルが見つかりません。静的配信にフォールバックします");
}

// index.html をメモリキャッシュ + fsWatch で自動リロード（ビルドのたびに更新）
const indexHtmlPath = path.join(CLIENT_DIST_PATH, "index.html");
let indexHtmlCache: string | null = null;

function reloadIndexHtml() {
  try {
    indexHtmlCache = readFileSync(indexHtmlPath, "utf-8");
  } catch {
    indexHtmlCache = null;
  }
}

reloadIndexHtml();
try {
  watch(indexHtmlPath, reloadIndexHtml);
} catch { /* ファイルが存在しない場合は無視 */ }

// JSON を HTML 内で安全に出力する（</script> インジェクション回避）
function safeJSON(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

// SSR データプリフェッチ（ルートごとに必要なデータを DB から直接取得）
async function fetchSSRData(pathname: string): Promise<Record<string, unknown[]>> {
  if (pathname === "/" || pathname === "") {
    const posts = await Post.findAll({ limit: 30, offset: 0 });
    return { "/api/v1/posts": posts.map((p) => p.toJSON()) };
  }
  return {};
}

// SSR ミドルウェア（HTML ナビゲーション要求のみ）
staticRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  if (
    req.method !== "GET" ||
    req.path.includes(".") || // 拡張子あり = 静的ファイル
    ssrRender === null ||
    indexHtmlCache === null
  ) {
    return next();
  }

  const [before, after] = indexHtmlCache.split('<div id="app"></div>');

  // preamble（<head> + CSS/JS リンク）を即時送信
  // → ブラウザが CSS・JS の並行ダウンロードを開始できる
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.write(before + '<div id="app">');

  try {
    const ssrData = await fetchSSRData(req.path);
    const ssrDataScript = `<script>window.__SSR_DATA__=${safeJSON(ssrData)};</script>`;
    const closingHtml = "</div>" + after.replace("</body>", ssrDataScript + "</body>");

    const pass = new PassThrough();
    pass.pipe(res, { end: false });
    pass.on("finish", () => {
      if (!res.writableEnded) res.end(closingHtml);
    });
    pass.on("error", () => {
      if (!res.writableEnded) res.end(closingHtml);
    });

    ssrRender(
      req.url,
      ssrData,
      (pipe) => pipe(pass),
      (err) => {
        console.error("[SSR] レンダリングエラー:", err);
        pass.end();
      },
    );
  } catch (err) {
    console.error("[SSR] ミドルウェアエラー:", err);
    // preamble 送信済みのため next() は使えない。空コンテンツで閉じる
    if (!res.writableEnded) res.end("</div>" + after);
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// アップロードファイル（UUID アドレッサブル: 変更なし）
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

// 公開静的ファイル（フォント・画像・動画・音声 等）
staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

// クライアントビルド成果物
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("/index.html") || filePath.endsWith("\\index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);
