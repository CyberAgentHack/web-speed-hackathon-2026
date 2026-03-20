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
let ssrBundle: {
  render: (
    pageName: string,
    pageProps: Record<string, unknown>,
    ssrData: unknown,
  ) => { html: string; helmetContext: Record<string, unknown> };
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

function buildHtml(
  appHtml: string,
  helmetContext: Record<string, unknown>,
  ssrData: unknown,
  pageName: string,
): string {
  const entry = entrypoints[pageName];
  if (!entry) {
    console.error("SSR: No entrypoint found for page:", pageName);
    return "";
  }

  const cssLinks = entry.css.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n");
  const jsScripts = entry.js.map((src) => `<script defer src="${src}"></script>`).join("\n");

  // Helmet tags
  let titleTag = "<title>CaX</title>";
  let metaTags = "";
  let linkTags = "";
  const helmet = (helmetContext as Record<string, unknown>).helmet as
    | { title: { toString: () => string }; meta: { toString: () => string }; link: { toString: () => string } }
    | undefined;
  if (helmet) {
    const titleStr = helmet.title.toString();
    if (titleStr) {
      titleTag = titleStr;
    }
    const metaStr = helmet.meta.toString();
    if (metaStr) {
      metaTags = metaStr;
    }
    const linkStr = helmet.link.toString();
    if (linkStr) {
      linkTags = linkStr;
    }
  }

  const serialized = JSON.stringify(ssrData).replace(/</g, "\\u003c");
  const ssrDataScript = `<script>window.__SSR_DATA__=${serialized}</script>`;

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${titleTag}
${metaTags}
${linkTags}
${cssLinks}
${jsScripts}
</head>
<body class="bg-cax-canvas text-cax-text">
<div id="app">${appHtml}</div>
${ssrDataScript}
</body>
</html>`;
}

function buildFallbackHtml(pageName: string): string {
  const entry = entrypoints[pageName];
  if (!entry) return "";

  const cssLinks = entry.css.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n");
  const jsScripts = entry.js.map((src) => `<script defer src="${src}"></script>`).join("\n");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CaX</title>
${cssLinks}
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

  try {
    const ssrData = await fetchSSRData(req.path, req.session?.userId);

    const { html: appHtml, helmetContext } = ssrBundle.render(pageName, pageProps, ssrData);

    const fullHtml = buildHtml(appHtml, helmetContext, ssrData, pageName);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
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
