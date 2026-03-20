import { readFileSync } from "node:fs";
import path from "node:path";

import { Router } from "express";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const prefetchRouter = Router();

let htmlTemplate: string | null = null;

function getHtml(): string {
  if (!htmlTemplate) {
    htmlTemplate = readFileSync(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");
  }
  return htmlTemplate;
}

// Route-based data prefetching
async function getPrefetchData(urlPath: string): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  // Home timeline
  if (urlPath === "/" || urlPath === "") {
    data["/api/v1/posts?limit=30&offset=0"] = await Post.findAll({ limit: 30, offset: 0 });
  }

  // Post detail
  const postMatch = urlPath.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    const post = await Post.findByPk(postMatch[1]);
    if (post) {
      data[`/api/v1/posts/${postMatch[1]}`] = post;
      data[`/api/v1/posts/${postMatch[1]}/comments?limit=30&offset=0`] = [];
    }
  }

  // User profile
  const userMatch = urlPath.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    const user = await User.findOne({ where: { username: userMatch[1] } });
    if (user) {
      data[`/api/v1/users/${userMatch[1]}`] = user;
      data[`/api/v1/users/${userMatch[1]}/posts?limit=30&offset=0`] = await Post.findAll({
        where: { userId: user.id },
        limit: 30,
        offset: 0,
      });
    }
  }

  return data;
}

// Intercept HTML requests and inject prefetch data
prefetchRouter.use(async (req, res, next) => {
  // Only handle navigation requests (not API, not static assets)
  const accept = req.headers.accept || "";
  if (!accept.includes("text/html")) return next();
  if (req.path.startsWith("/api/")) return next();
  if (/\.\w+$/.test(req.path)) return next();

  try {
    const prefetchData = await getPrefetchData(req.path);
    const html = getHtml();

    if (Object.keys(prefetchData).length === 0) {
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(html);
    }

    const script = `<script>window.__PREFETCH__=${JSON.stringify(prefetchData)}</script>`;
    const injected = html.replace("</head>", `${script}</head>`);

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache");
    return res.send(injected);
  } catch {
    return next();
  }
});