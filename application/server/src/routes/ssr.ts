import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { Router } from "express";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { fetchSSRData } from "@web-speed-hackathon-2026/server/src/ssr/data-fetcher";

const esmRequire = createRequire(import.meta.url);

export const ssrRouter = Router();

let headHtml = "";
let tailHtml = "";
let indexHtmlContent = "";
let ssrBundle: { render: (url: string, ssrData: unknown) => { html: string; helmetContext: Record<string, unknown> } } | null =
  null;
let initialized = false;

function initialize() {
  if (initialized) return;
  initialized = true;

  try {
    const indexHtmlPath = path.join(CLIENT_DIST_PATH, "index.html");
    indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf-8");

    const appDivMarker = '<div id="app">';
    const appDivIdx = indexHtmlContent.indexOf(appDivMarker);
    if (appDivIdx === -1) {
      console.error("SSR: Could not find <div id=\"app\"> in index.html");
      return;
    }
    headHtml = indexHtmlContent.substring(0, appDivIdx);
    const afterAppDiv = indexHtmlContent.substring(appDivIdx + appDivMarker.length);
    const closeDivIdx = afterAppDiv.indexOf("</div>");
    if (closeDivIdx !== -1) {
      tailHtml = afterAppDiv.substring(closeDivIdx + "</div>".length);
    } else {
      tailHtml = "</body></html>";
    }
  } catch (err) {
    console.error("SSR: Failed to read index.html:", err);
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

function sendCSRFallback(res: import("express").Response) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(indexHtmlContent);
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

  // CSR fallback when SSR bundle is unavailable
  if (!ssrBundle || !headHtml) {
    if (indexHtmlContent) {
      return sendCSRFallback(res);
    }
    return next();
  }

  try {
    const ssrData = await fetchSSRData(req.path, req.session?.userId);

    const { html: appHtml, helmetContext } = ssrBundle.render(req.path, ssrData);

    // Inject Helmet tags into head
    let finalHead = headHtml;
    const helmet = (helmetContext as Record<string, unknown>).helmet as
      | { title: { toString: () => string }; meta: { toString: () => string }; link: { toString: () => string } }
      | undefined;
    if (helmet) {
      const titleStr = helmet.title.toString();
      if (titleStr) {
        finalHead = finalHead.replace(/<title>CaX<\/title>/, titleStr);
      }
      const metaStr = helmet.meta.toString();
      if (metaStr) {
        finalHead = finalHead.replace("</head>", `${metaStr}</head>`);
      }
      const linkStr = helmet.link.toString();
      if (linkStr) {
        finalHead = finalHead.replace("</head>", `${linkStr}</head>`);
      }
    }

    // Serialize SSR data safely
    const serialized = JSON.stringify(ssrData).replace(/</g, "\\u003c");
    const ssrDataScript = `<script>window.__SSR_DATA__=${serialized}</script>`;

    const fullHtml = `${finalHead}<div id="app">${appHtml}</div>${ssrDataScript}${tailHtml}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(fullHtml);
  } catch (err) {
    console.error("SSR render error:", err);
    // Fall back to CSR
    sendCSRFallback(res);
  }
});
