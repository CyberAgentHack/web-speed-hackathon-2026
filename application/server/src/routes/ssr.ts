import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";

import { app } from "@web-speed-hackathon-2026/server/src/app";
import { CLIENT_DIST_PATH, SSR_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

interface SSRData {
  activeUser?: unknown;
  posts?: unknown[];
  post?: unknown;
  comments?: unknown[];
  user?: unknown;
  userPosts?: unknown[];
  sentiment?: { score: number; label: string } | null;
}

// --- 起動時: dist/index.html からアセットパスを抽出 ---

let csrFallbackHtml = "";
let entryScript = "";
let cssHref = "";

try {
  const indexHtml = fs.readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");
  csrFallbackHtml = indexHtml;

  const scriptMatch = indexHtml.match(/<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*>/);
  if (scriptMatch) {
    entryScript = scriptMatch[1]!;
  }

  const cssMatch = indexHtml.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
  if (cssMatch) {
    cssHref = cssMatch[1]!;
  }

  console.log("SSR: assets extracted — script:", entryScript, "css:", cssHref);
} catch {
  console.warn("SSR: index.html not found in dist, SSR will be disabled");
}

// --- 起動時: SSR バンドル読み込み ---

type RenderFn = (options: {
  url: string;
  ssrData: unknown;
  bootstrapModules: string[];
  cssHref: string;
}) => Promise<ReadableStream>;

let ssrRender: RenderFn | null = null;
try {
  const ssrPath = path.resolve(SSR_DIST_PATH, "entry-server.js");
  console.log("SSR: loading from", ssrPath);
  const ssrModule = await import(ssrPath);
  ssrRender = ssrModule.render;
  console.log("SSR: renderer loaded, type:", typeof ssrRender);
} catch (e: unknown) {
  console.warn("SSR: failed to load entry-server:", e);
}

export function clearSsrCache() {
  // ストリームベースの SSR ではリクエストごとにレンダリングする
}

// --- 内部 API フェッチ ---

async function internalFetch(apiPath: string, cookie?: string): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (cookie) headers["Cookie"] = cookie;
  const res = await app.request(apiPath, { headers });
  if (!res.ok) return null;
  return res.json();
}

// --- ルートごとの SSR データ計画 ---

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
    if (!q) return { posts: "" };
    const encodedQ = encodeURIComponent(q);
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

async function fetchSSRData(urlPath: string, cookie?: string): Promise<SSRData | null> {
  const plan = planSSRFetches(urlPath);
  if (plan === null) return null;

  const entries: Array<[string, Promise<unknown>]> = [
    ["activeUser", cookie ? internalFetch("/api/v1/me", cookie) : Promise.resolve(null)],
  ];

  for (const [key, apiPath] of Object.entries(plan)) {
    if (!apiPath) {
      entries.push([key, Promise.resolve([])]);
    } else {
      entries.push([key, internalFetch(apiPath, cookie)]);
    }
  }

  const keys = entries.map(([k]) => k);
  const values = await Promise.all(entries.map(([, p]) => p));

  const ssrData: SSRData = {};
  for (let i = 0; i < keys.length; i++) {
    (ssrData as Record<string, unknown>)[keys[i]!] = values[i] ?? null;
  }

  return ssrData;
}

// --- SSR ルーター ---

export const ssrRouter = new Hono<SessionEnv>();

ssrRouter.get("*", async (c) => {
  if (c.req.path.startsWith("/api") || /\.\w+$/.test(c.req.path)) {
    return c.notFound();
  }

  if (!csrFallbackHtml || !ssrRender) {
    c.header("Cache-Control", "no-cache");
    return c.html(csrFallbackHtml || "<!doctype html><html><body>SSR not available</body></html>");
  }

  try {
    const url = new URL(c.req.url);
    const fullPath = url.pathname + url.search;
    const cookie = c.req.header("Cookie");
    const ssrData = await fetchSSRData(fullPath, cookie);

    if (ssrData === null) {
      // CSR フォールバック: dist/index.html をそのまま返す
      c.header("Cache-Control", "no-cache");
      return c.html(csrFallbackHtml);
    }

    // React がフルドキュメントをストリーム出力
    const reactStream = await ssrRender!({
      url: fullPath,
      ssrData,
      bootstrapModules: [entryScript],
      cssHref,
    });

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    return c.body(reactStream);
  } catch (error: unknown) {
    console.error("SSR handler error:", error);
    c.header("Cache-Control", "no-cache");
    return c.html(csrFallbackHtml);
  }
});
