import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";

import { app } from "@web-speed-hackathon-2026/server/src/app";
import { CLIENT_DIST_PATH, SSR_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

// SSRData: クライアントの AppContainer.SSRData と同じ構造
interface SSRData {
  activeUser?: unknown;
  posts?: unknown[];
  post?: unknown;
  comments?: unknown[];
  user?: unknown;
  userPosts?: unknown[];
  sentiment?: { score: number; label: string } | null;
}

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
type RenderFn = (url: string, ssrData: any) => Promise<ReadableStream>;
let ssrRender: RenderFn | null = null;
try {
  const ssrPath = path.resolve(SSR_DIST_PATH, "entry-server.js");
  console.log("SSR: loading from", ssrPath);
  // Cache busting: Bun の ESM キャッシュは動的 import のパスが同一だと
  // ファイル変更を検知しない（bun --watch のソフトリスタートで残る）。
  // タイムスタンプ付きクエリで強制再読み込みする。
  const ssrModule = await import(`${ssrPath}?v=${Date.now()}`);
  ssrRender = ssrModule.render;
  console.log("SSR: renderer loaded, type:", typeof ssrRender);
} catch (e: unknown) {
  console.warn("SSR: failed to load entry-server:", e);
}

function csrFallbackHtml(): string {
  return inlinedTemplateHtml.replace("<!--ssr-outlet-->", "").replace("<!--ssr-head-->", "");
}

function buildPreloadHints(ssrData: SSRData): string {
  const hints: string[] = [];
  const firstPosts = (ssrData.posts ?? ssrData.userPosts ?? []) as Array<{
    images?: Array<{ id: string }>;
    movie?: { id: string } | null;
  }>;
  for (const post of firstPosts.slice(0, 5)) {
    if (post.movie) {
      hints.push(`<link rel="preload" as="video" href="/movies/${post.movie.id}.mp4">`);
      break;
    }
    if (post.images && post.images.length > 0) {
      hints.push(`<link rel="preload" as="image" href="/images/${post.images[0]!.id}.jpg">`);
      break;
    }
  }
  return hints.join("\n");
}

export function clearSsrCache() {
  // ストリームベースの SSR ではリクエストごとにレンダリングする
}

// app.request() で内部 API を叩いて JSON を返す（HTTP オーバーヘッドなし）
async function internalFetch(apiPath: string, cookie?: string): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (cookie) headers["Cookie"] = cookie;
  const res = await app.request(apiPath, { headers });
  if (!res.ok) return null;
  return res.json();
}

// ルートごとに必要な API パスを返す（ルートマッチのみ、データ取得ロジックなし）
function planSSRFetches(urlPath: string): Record<string, string> | null {
  const parsed = new URL(urlPath, "http://localhost");
  const pathname = parsed.pathname;

  if (pathname === "/") {
    return { posts: "/api/v1/posts?limit=30&offset=0" };
  }

  const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    const postId = postMatch[1]!;
    return {
      post: `/api/v1/posts/${postId}`,
      comments: `/api/v1/posts/${postId}/comments?limit=30&offset=0`,
    };
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    const username = userMatch[1]!;
    return {
      user: `/api/v1/users/${username}`,
      userPosts: `/api/v1/users/${username}/posts?limit=30&offset=0`,
    };
  }

  if (pathname === "/search") {
    const q = parsed.searchParams.get("q");
    if (!q) return { posts: "" }; // 空クエリ → 空配列で返す
    // 検索キーワードの感情分析も並列フェッチ（クライアント側のブロッキング fetch を回避）
    const encodedQ = encodeURIComponent(q);
    // q からキーワード部分を抽出（since:/until: を除去）
    const keywords = q.replace(/\b(?:since|until):\S+/g, "").trim();
    const plan: Record<string, string> = {
      posts: `/api/v1/search?q=${encodedQ}&limit=30&offset=0`,
    };
    if (keywords) {
      plan["sentiment"] = `/api/v1/sentiment?text=${encodeURIComponent(keywords)}`;
    }
    return plan;
  }

  if (pathname === "/terms") {
    return {};
  }

  // /dm, /crok 等 → CSR フォールバック
  return null;
}

// 全 API を並列で叩き、SSRData を組み立てる
async function fetchSSRData(urlPath: string, cookie?: string): Promise<SSRData | null> {
  const plan = planSSRFetches(urlPath);
  if (plan === null) return null;

  // activeUser は常に取得（cookie があればログインユーザー情報、なければ null）
  const entries: Array<[string, Promise<unknown>]> = [
    ["activeUser", cookie ? internalFetch("/api/v1/me", cookie) : Promise.resolve(null)],
  ];

  for (const [key, apiPath] of Object.entries(plan)) {
    if (!apiPath) {
      // 空パス（例: search で q なし）→ 空配列
      entries.push([key, Promise.resolve([])]);
    } else {
      entries.push([key, internalFetch(apiPath, cookie)]);
    }
  }

  // 全 Promise を並列解決
  const keys = entries.map(([k]) => k);
  const values = await Promise.all(entries.map(([, p]) => p));

  const ssrData: SSRData = {};
  for (let i = 0; i < keys.length; i++) {
    (ssrData as Record<string, unknown>)[keys[i]!] = values[i] ?? null;
  }

  return ssrData;
}

// HTML テンプレートを <!--ssr-outlet--> で分割して前後パーツを事前計算
let htmlBefore = "";
let htmlAfter = "";
if (inlinedTemplateHtml) {
  const outletMarker = "<!--ssr-outlet-->";
  const idx = inlinedTemplateHtml.indexOf(outletMarker);
  if (idx !== -1) {
    htmlBefore = inlinedTemplateHtml.slice(0, idx);
    htmlAfter = inlinedTemplateHtml.slice(idx + outletMarker.length);
  }
}

function buildSSRHeadInjection(ssrData: SSRData): string {
  const preloadHints = buildPreloadHints(ssrData);
  const ssrDataScript = `<script>window.__SSR_DATA__=${JSON.stringify(ssrData).replace(/</g, "\\u003c")}</script>`;
  return preloadHints + ssrDataScript;
}

function buildSSRStream(reactStream: ReadableStream, ssrData: SSRData): ReadableStream {
  const encoder = new TextEncoder();
  const headInjection = buildSSRHeadInjection(ssrData);
  const before = htmlBefore;
  const after = htmlAfter.replace("<!--ssr-head-->", headInjection);

  let phase: "before" | "react" | "after" | "done" = "before";
  let reactReader: ReadableStreamDefaultReader<Uint8Array>;

  return new ReadableStream({
    start() {
      reactReader = reactStream.getReader();
    },
    async pull(controller) {
      if (phase === "before") {
        controller.enqueue(encoder.encode(before));
        phase = "react";
        return;
      }
      if (phase === "react") {
        const { done, value } = await reactReader.read();
        if (!done) {
          controller.enqueue(value);
          return;
        }
        phase = "after";
      }
      if (phase === "after") {
        controller.enqueue(encoder.encode(after));
        phase = "done";
        return;
      }
      controller.close();
    },
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
    const url = new URL(c.req.url);
    const fullPath = url.pathname + url.search;

    const cookie = c.req.header("Cookie");
    const ssrData = await fetchSSRData(fullPath, cookie);

    if (ssrData === null) {
      c.header("Cache-Control", "no-cache");
      return c.html(csrFallbackHtml());
    }

    const reactStream = await ssrRender!(fullPath, ssrData);
    const responseStream = buildSSRStream(reactStream, ssrData);

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    return c.body(responseStream);
  } catch (error: unknown) {
    console.error("SSR handler error:", error);
    c.header("Cache-Control", "no-cache");
    return c.html(csrFallbackHtml());
  }
});
