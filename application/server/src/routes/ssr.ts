import fs from "node:fs";
import path from "node:path";
import { Transform } from "node:stream";

import { Hono } from "hono";

import { CLIENT_DIST_PATH, SSR_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import {
  getServerData,
  type SSRData,
} from "@web-speed-hackathon-2026/server/src/ssr/getServerData";

// Production で使う index.html テンプレートを起動時に読み込み
let templateHtml = "";
try {
  templateHtml = fs.readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");
} catch {
  console.warn("SSR: index.html not found in dist, SSR will be disabled");
}

// Critical CSS inlining: CSS ファイルを読み込んでインライン化
let inlinedTemplateHtml = templateHtml;
if (templateHtml) {
  const cssLinkMatch = templateHtml.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
  if (cssLinkMatch) {
    const cssHref = cssLinkMatch[1]!;
    try {
      const cssPath = path.resolve(CLIENT_DIST_PATH, cssHref.replace(/^\//, ""));
      const cssContent = fs.readFileSync(cssPath, "utf-8");
      inlinedTemplateHtml = templateHtml.replace(cssLinkMatch[0], `<style>${cssContent}</style>`);
    } catch {
      console.warn("SSR: CSS file not found for inlining, keeping link tag");
    }
  }
  // フォント preload を <head> に追加
  inlinedTemplateHtml = inlinedTemplateHtml.replace(
    "</head>",
    `<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Heavy-subset.woff2" crossorigin>\n</head>`,
  );
}

// SSR バンドルの読み込み
type RenderFn = (url: string, ssrData: any, opts?: any) => { pipe: (dest: any) => any };
let ssrRender: RenderFn | null = null;
try {
  const ssrModule = await import(path.resolve(SSR_DIST_PATH, "entry-server.js"));
  ssrRender = ssrModule.render;
} catch {
  console.warn("SSR: entry-server.js not found in dist-ssr, SSR will be disabled");
}

function csrFallbackHtml(): string {
  return inlinedTemplateHtml.replace("<!--ssr-outlet-->", "").replace("<!--ssr-head-->", "");
}

function buildPreloadHints(ssrData: SSRData): string {
  const hints: string[] = [];
  // LCP 画像 preload: タイムラインの最初の投稿の最初の画像
  const firstPosts = ssrData.posts ?? ssrData.userPosts ?? [];
  for (const post of firstPosts.slice(0, 1)) {
    if (post.images && post.images.length > 0) {
      hints.push(`<link rel="preload" as="image" href="/images/${post.images[0]!.id}.jpg">`);
      break;
    }
  }
  return hints.join("\n");
}

// 未ログインユーザー向け SSR キャッシュ（パス → HTML 文字列）
const ssrCache = new Map<string, string>();

export function clearSsrCache() {
  ssrCache.clear();
}

async function renderToString(url: string, ssrData: SSRData): Promise<string> {
  const [beforeOutlet, afterOutlet] = inlinedTemplateHtml.split("<!--ssr-outlet-->");
  const preloadHints = buildPreloadHints(ssrData);
  const ssrDataScript = `${preloadHints}<script>window.__SSR_DATA__=${JSON.stringify(ssrData).replace(/</g, "\\u003c")}</script>`;
  const afterWithHead = afterOutlet!.replace("<!--ssr-head-->", ssrDataScript);

  return new Promise<string>((resolve, reject) => {
    let didError = false;
    const chunks: Buffer[] = [];

    const collectStream = new Transform({
      transform(chunk, _encoding, callback) {
        chunks.push(chunk);
        callback();
      },
      flush(callback) {
        chunks.push(Buffer.from(afterWithHead));
        callback();
      },
    });

    const { pipe } = ssrRender!(url, ssrData, {
      onShellReady() {
        if (didError) return;
        chunks.push(Buffer.from(beforeOutlet!));
        pipe(collectStream);
        collectStream.on("finish", () => {
          resolve(Buffer.concat(chunks).toString("utf-8"));
        });
      },
      onShellError(error: unknown) {
        didError = true;
        reject(error);
      },
      onError(error: unknown) {
        didError = true;
        console.error("SSR render error:", error);
      },
    });
  });
}

export const ssrRouter = new Hono<SessionEnv>();

ssrRouter.get("*", async (c) => {
  if (c.req.path.startsWith("/api") || /\.\w+$/.test(c.req.path)) {
    return c.notFound();
  }

  if (!templateHtml || !ssrRender) {
    c.header("Cache-Control", "no-cache");
    return c.html(csrFallbackHtml());
  }

  try {
    const session = c.get("session");
    const userId = session.get()?.userId;

    // 未ログインなら SSR キャッシュを使う
    if (!userId) {
      const cached = ssrCache.get(c.req.path);
      if (cached) {
        c.header("Content-Type", "text/html; charset=utf-8");
        c.header("Cache-Control", "no-cache");
        return c.body(cached);
      }
    }

    const ssrData = await getServerData(c.req.path, userId);

    if (ssrData === null) {
      c.header("Cache-Control", "no-cache");
      return c.html(csrFallbackHtml());
    }

    const html = await renderToString(c.req.path, ssrData);

    // 未ログインならキャッシュに保存
    if (!userId) {
      ssrCache.set(c.req.path, html);
    }

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    return c.body(html);
  } catch (error) {
    console.error("SSR handler error:", error);
    c.header("Cache-Control", "no-cache");
    return c.html(csrFallbackHtml());
  }
});
