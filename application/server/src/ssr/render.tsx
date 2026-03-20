import fs from "node:fs";
import path from "node:path";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// ビルド済みファイルをキャッシュ
let templateHtml: string | null = null;
let mainCssContent: string | null = null;
let ssrModule: { render: (url: string, data: any) => { html: string; renderLimit: number } } | null = null;

function getTemplate(): string {
  if (templateHtml !== null) return templateHtml;
  const indexPath = path.join(CLIENT_DIST_PATH, "index.html");
  templateHtml = fs.readFileSync(indexPath, "utf-8");
  return templateHtml;
}

function getMainCss(): string | null {
  if (mainCssContent !== null) return mainCssContent;
  // Viteのビルド出力からCSSファイルを探す
  const stylesDir = path.join(CLIENT_DIST_PATH, "styles");
  if (!fs.existsSync(stylesDir)) return null;
  const cssFiles = fs.readdirSync(stylesDir).filter((f) => f.endsWith(".css"));
  // エントリCSS（index.*.css）を優先、なければ最初のCSSファイル
  const mainCssFile = cssFiles.find((f) => f.startsWith("index.")) ?? cssFiles[0];
  if (!mainCssFile) return null;
  mainCssContent = fs.readFileSync(path.join(stylesDir, mainCssFile), "utf-8");
  return mainCssContent;
}

async function getSSRModule() {
  if (ssrModule !== null) return ssrModule;
  const serverDir = path.join(CLIENT_DIST_PATH, "server", "scripts");
  const entryFile = fs.readdirSync(serverDir).find((f) => f.startsWith("entry-server"));
  if (!entryFile) throw new Error("SSR entry not found");
  ssrModule = await import(path.join(serverDir, entryFile));
  return ssrModule!;
}

interface SSRData {
  posts?: unknown[];
  user?: unknown | null;
}

// SSRレスポンスキャッシュ
const ssrCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL_MS = 5000;

/**
 * ViteのSSRバンドルを使ってレンダリングし、データを埋め込んだHTMLを返す
 */
export async function renderAppShell(url: string, data: SSRData): Promise<string> {
  // キャッシュチェック
  const cached = ssrCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.html;
  }

  const template = getTemplate();
  const css = getMainCss();
  const ssr = await getSSRModule();

  // Vite SSRバンドルで実際のクライアントコンポーネントをレンダリング
  const { html: shellHtml, renderLimit } = ssr.render(url, data);

  // データ埋め込み用のスクリプトタグ
  const dataScript = buildDataScript(data, renderLimit);

  // テンプレートにシェルHTMLとデータを注入
  let html = template.replace(
    '<div id="app"></div>',
    `<div id="app">${shellHtml}</div>`,
  );

  // preloadスクリプトをSSRデータスクリプトに置き換え
  html = html.replace(
    /<script>window\.__PRELOAD_ME.*?<\/script>/,
    dataScript,
  );

  // CSSをインライン化（レンダーブロッキング排除）
  if (css) {
    html = html.replace(
      /<link[^>]*rel="stylesheet"[^>]*>/,
      `<style>${css}</style>`,
    );
  }

  // フォントpreload（CSS解析前にフォント取得を開始）
  const fontPreloads = [
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Regular.woff2" crossorigin>',
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Heavy.woff2" crossorigin>',
  ].join("");
  html = html.replace("</head>", `${fontPreloads}</head>`);

  // キャッシュに保存
  ssrCache.set(url, { html, timestamp: Date.now() });

  return html;
}

// JSON内の </script> をエスケープしてXSSを防止
function safeJSON(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

function buildDataScript(data: SSRData, renderLimit: number): string {
  const parts: string[] = [];

  if (data.posts !== undefined) {
    parts.push(`window.__SSR_POSTS__=${safeJSON(data.posts)}`);
    parts.push(`window.__SSR_RENDER_LIMIT__=${renderLimit}`);
  }

  if (data.user !== undefined) {
    parts.push(`window.__SSR_USER__=${safeJSON(data.user)}`);
  }

  if (parts.length === 0) return "";
  return `<script>${parts.join(";")}</script>`;
}
