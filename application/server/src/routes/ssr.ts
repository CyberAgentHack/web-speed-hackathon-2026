import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { Router } from "express";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { fetchSSRData } from "@web-speed-hackathon-2026/server/src/ssr/data-fetcher";

const esmRequire = createRequire(import.meta.url);

export const ssrRouter = Router();

interface Entrypoints {
  [name: string]: { js: string[]; css: string[] };
}

let entrypoints: Entrypoints = {};
const inlineCssCache: Record<string, string> = {};
const fontPreloadCache: Record<string, string[]> = {};
const staticHtmlCache: Record<string, string> = {};
const STATIC_PAGES = new Set(["terms", "not-found"]);
let ssrBundle: {
  render: (
    pageName: string,
    pageProps: Record<string, unknown>,
    ssrData: unknown,
  ) => { html: string };
} | null = null;
let initialized = false;

interface RouteMatch {
  pageName: string;
  pageProps: Record<string, unknown>;
}

function matchRoute(pathname: string): RouteMatch {
  if (pathname === "/") {
    return { pageName: "timeline", pageProps: {} };
  }
  if (pathname === "/dm") {
    return { pageName: "dm-list", pageProps: {} };
  }
  const dmMatch = pathname.match(/^\/dm\/([^/]+)$/);
  if (dmMatch) {
    return { pageName: "dm", pageProps: { conversationId: dmMatch[1] } };
  }
  if (pathname === "/search") {
    return { pageName: "search", pageProps: {} };
  }
  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    return { pageName: "user-profile", pageProps: { username: decodeURIComponent(userMatch[1]!) } };
  }
  const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    return { pageName: "post", pageProps: { postId: postMatch[1] } };
  }
  if (pathname === "/terms") {
    return { pageName: "terms", pageProps: {} };
  }
  if (pathname === "/crok") {
    return { pageName: "crok", pageProps: {} };
  }
  return { pageName: "not-found", pageProps: {} };
}

function initialize() {
  if (initialized) return;
  initialized = true;

  try {
    const entrypointsPath = path.join(CLIENT_DIST_PATH, "entrypoints.json");
    if (fs.existsSync(entrypointsPath)) {
      entrypoints = JSON.parse(fs.readFileSync(entrypointsPath, "utf-8"));
    } else {
      console.warn("SSR: entrypoints.json not found at", entrypointsPath);
    }
  } catch (err) {
    console.error("SSR: Failed to read entrypoints.json:", err);
  }

  for (const [name, entry] of Object.entries(entrypoints)) {
    const fontUrls: string[] = [];
    for (const href of entry.css) {
      if (!inlineCssCache[href]) {
        try {
          const cssPath = path.join(CLIENT_DIST_PATH, href);
          let content = fs.readFileSync(cssPath, "utf-8");
          // Rewrite relative url() to absolute paths so CSS works when inlined in HTML
          const cssDir = href.substring(0, href.lastIndexOf("/") + 1);
          content = content.replace(/url\(["']?(?!(?:data:|https?:|\/))([^"')]+)["']?\)/g, (_match, relUrl: string) => {
            return `url(${cssDir}${relUrl})`;
          });
          inlineCssCache[href] = content;
        } catch {
          // CSS file not found; will fall back to <link> in buildHtml
        }
      }
      const content = inlineCssCache[href];
      if (content) {
        const fontUrlRegex = /url\(["']?([^"')]*\.woff2)["']?\)/g;
        let match;
        while ((match = fontUrlRegex.exec(content)) !== null) {
          const url = match[1]!;
          if (!fontUrls.includes(url)) {
            fontUrls.push(url);
          }
        }
      }
    }
    fontPreloadCache[name] = fontUrls;
  }

  try {
    const ssrBundlePath = path.join(CLIENT_DIST_PATH, "ssr", "entry-server.cjs");
    if (fs.existsSync(ssrBundlePath)) {
      ssrBundle = esmRequire(ssrBundlePath);
    } else {
      console.warn("SSR: Bundle not found at", ssrBundlePath);
    }
  } catch (err) {
    console.error("SSR: Failed to load SSR bundle:", err);
    ssrBundle = null;
  }
}

interface SSRData {
  routeData: Record<string, unknown>;
  activeUser: unknown | null;
}

function getTitle(pageName: string, pageProps: Record<string, unknown>, ssrData: SSRData): string {
  switch (pageName) {
    case "timeline":
      return "タイムライン - CaX";
    case "dm-list":
      return "ダイレクトメッセージ - CaX";
    case "dm": {
      const convId = pageProps["conversationId"] as string;
      const conv = ssrData.routeData[`/api/v1/dm/${convId}`] as { initiator: { id: string; name: string }; member: { id: string; name: string } } | undefined;
      if (conv && ssrData.activeUser) {
        const activeUserId = (ssrData.activeUser as { id: string }).id;
        const peer = conv.initiator.id !== activeUserId ? conv.initiator : conv.member;
        return `${peer.name} さんとのダイレクトメッセージ - CaX`;
      }
      return "ダイレクトメッセージ - CaX";
    }
    case "search":
      return "検索 - CaX";
    case "user-profile": {
      const username = pageProps.username as string;
      const user = ssrData.routeData[`/api/v1/users/${username}`] as { name: string } | undefined;
      return user ? `${user.name} さんのタイムライン - CaX` : "CaX";
    }
    case "post": {
      const postId = pageProps.postId as string;
      const post = ssrData.routeData[`/api/v1/posts/${postId}`] as { user: { name: string } } | undefined;
      return post ? `${post.user.name} さんのつぶやき - CaX` : "CaX";
    }
    case "terms":
      return "利用規約 - CaX";
    case "crok":
      return "Crok - CaX";
    case "not-found":
      return "ページが見つかりません - CaX";
    default:
      return "CaX";
  }
}

function buildHtml(
  appHtml: string,
  titleTag: string,
  ssrData: unknown,
  pageName: string,
): string {
  const entry = entrypoints[pageName];
  if (!entry) {
    console.error("SSR: No entrypoint found for page:", pageName);
    return "";
  }

  const fontPreloads = (fontPreloadCache[pageName] ?? [])
    .slice(0, 3)
    .map((url) => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`)
    .join("\n");
  const cssInline = entry.css.map((href) => {
    const content = inlineCssCache[href];
    if (content) {
      return `<style>${content}</style>`;
    }
    return `<link rel="stylesheet" href="${href}">`;
  }).join("\n");
  const jsScripts = entry.js.map((src) => `<script defer src="${src}"></script>`).join("\n");

  const serialized = JSON.stringify(ssrData).replace(/</g, "\\u003c");
  const ssrDataScript = `<script>window.__SSR_DATA__=${serialized}</script>`;

  const initScripts: string[] = [];
  if (pageName === "dm") {
    initScripts.push(`<script>(function(){var e=document.querySelector("[data-dm-scroll]");if(e)e.scrollTop=e.scrollHeight})()</script>`);
  }

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titleTag}</title>
<link rel="dns-prefetch" href="/">
${fontPreloads}
${cssInline}
${jsScripts}
</head>
<body class="bg-cax-canvas text-cax-text">
<div id="app">${appHtml}</div>
${initScripts.join("\n")}
${ssrDataScript}
</body>
</html>`;
}

function buildFallbackHtml(pageName: string): string {
  const entry = entrypoints[pageName];
  if (!entry) return "";

  const cssInline = entry.css.map((href) => {
    const content = inlineCssCache[href];
    if (content) {
      return `<style>${content}</style>`;
    }
    return `<link rel="stylesheet" href="${href}">`;
  }).join("\n");
  const jsScripts = entry.js.map((src) => `<script defer src="${src}"></script>`).join("\n");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CaX</title>
${cssInline}
${jsScripts}
</head>
<body class="bg-cax-canvas text-cax-text">
<div id="app"></div>
</body>
</html>`;
}

ssrRouter.get("/{*any}", async (req, res, next) => {
  // Skip static assets
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/scripts/") ||
    req.path.startsWith("/styles/") ||
    req.path.startsWith("/images/") ||
    req.path.startsWith("/uploads/") ||
    req.path.startsWith("/fonts/") ||
    req.path.includes(".")
  ) {
    return next();
  }

  initialize();

  const { pageName, pageProps } = matchRoute(req.path);

  // CSR fallback when SSR bundle is unavailable
  if (!ssrBundle) {
    const fallbackHtml = buildFallbackHtml(pageName);
    if (fallbackHtml) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(fallbackHtml);
    }
    return next();
  }

  const isStatic = STATIC_PAGES.has(pageName);

  // Serve from cache for static pages without session
  if (isStatic && !req.session?.userId && staticHtmlCache[pageName]) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    return res.send(staticHtmlCache[pageName]);
  }

  try {
    const ssrData = await fetchSSRData(req.path, req.session?.userId);

    const { html: appHtml } = ssrBundle.render(pageName, pageProps, ssrData);
    const title = getTitle(pageName, pageProps, ssrData);

    const fullHtml = buildHtml(appHtml, title, ssrData, pageName);

    // Cache static pages for non-logged-in users
    if (isStatic && !req.session?.userId) {
      staticHtmlCache[pageName] = fullHtml;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", isStatic ? "public, max-age=300, s-maxage=3600" : "no-cache");
    res.send(fullHtml);
  } catch (err) {
    console.error("SSR render error:", err);
    // Fall back to CSR
    const fallbackHtml = buildFallbackHtml(pageName);
    if (fallbackHtml) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.send(fallbackHtml);
    } else {
      next();
    }
  }
});
