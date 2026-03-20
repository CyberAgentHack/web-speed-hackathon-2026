import { readFileSync } from "node:fs";
import path from "node:path";

import { Router } from "express";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const prefetchRouter = Router();

let headPart: string | null = null;
let bodyPart: string | null = null;

function loadHtmlParts(): void {
  if (headPart !== null) return;
  const html = readFileSync(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");
  const splitIdx = html.indexOf("</head>");
  headPart = html.slice(0, splitIdx);
  bodyPart = html.slice(splitIdx);
}

// Route-based data prefetching — runs queries in parallel where possible
async function getPrefetchData(urlPath: string, userId?: string): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  const promises: Array<Promise<void>> = [];

  // /api/v1/me — always prefetch (null for not-logged-in to avoid 401 roundtrip)
  promises.push(
    (userId
      ? User.findByPk(userId).then((me) => { data["/api/v1/me"] = me ?? null; })
      : Promise.resolve().then(() => { data["/api/v1/me"] = null; })
    ),
  );

  // Home timeline
  if (urlPath === "/" || urlPath === "") {
    promises.push(
      Post.findAll({ limit: 30, offset: 0 }).then((posts) => {
        data["/api/v1/posts?limit=30&offset=0"] = posts;
      }),
    );
  }

  // Post detail
  const postMatch = urlPath.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    promises.push(
      Post.findByPk(postMatch[1]).then((post) => {
        if (post) {
          data[`/api/v1/posts/${postMatch[1]}`] = post;
          data[`/api/v1/posts/${postMatch[1]}/comments?limit=30&offset=0`] = [];
        }
      }),
    );
  }

  // User profile
  const userMatch = urlPath.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    promises.push(
      User.findOne({ where: { username: userMatch[1] } }).then(async (user) => {
        if (user) {
          data[`/api/v1/users/${userMatch[1]}`] = user;
          data[`/api/v1/users/${userMatch[1]}/posts?limit=30&offset=0`] = await Post.findAll({
            where: { userId: user.id },
            limit: 30,
            offset: 0,
          });
        }
      }),
    );
  }

  await Promise.all(promises);
  return data;
}

// Extract LCP image preload links from prefetch data
function extractLcpPreloads(data: Record<string, unknown>, urlPath: string): string {
  const links: string[] = [];

  // Home: first post's first image or profile image
  const postsKey = "/api/v1/posts?limit=30&offset=0";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = data[postsKey] as any[] | undefined;
  if (posts && posts.length > 0) {
    const first = posts[0];
    const firstImg = first?.images?.[0];
    if (firstImg) {
      links.push(`<link rel="preload" as="image" href="/images/${firstImg.id}.avif" fetchpriority="high">`);
    }
    const profileImg = first?.user?.profileImage;
    if (profileImg) {
      links.push(`<link rel="preload" as="image" href="/images/profiles/${profileImg.id}.avif">`);
    }
  }

  // Post detail: the post's first image
  const postMatch = urlPath.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const post = data[`/api/v1/posts/${postMatch[1]}`] as any;
    const postImg = post?.images?.[0];
    if (postImg) {
      links.push(`<link rel="preload" as="image" href="/images/${postImg.id}.avif" fetchpriority="high">`);
    }
  }

  return links.join("");
}

// Intercept HTML requests — stream head first, then inject prefetch data
prefetchRouter.use(async (req, res, next) => {
  const accept = req.headers.accept || "";
  if (!accept.includes("text/html")) return next();
  if (req.path.startsWith("/api/")) return next();
  if (/\.\w+$/.test(req.path)) return next();

  try {
    loadHtmlParts();

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache");

    // Stream head immediately so browser starts loading CSS/JS
    res.write(headPart);

    // Run DB queries in parallel while browser downloads CSS/JS
    const prefetchData = await getPrefetchData(req.path, req.session.userId);

    // Inject LCP image preload hint for first post's image
    const lcpPreloads = extractLcpPreloads(prefetchData, req.path);
    if (lcpPreloads) {
      res.write(lcpPreloads);
    }

    if (Object.keys(prefetchData).length > 0) {
      res.write(`<script>window.__PREFETCH__=${JSON.stringify(prefetchData)}</script>`);
    }

    res.write(bodyPart);
    return res.end();
  } catch {
    return next();
  }
});