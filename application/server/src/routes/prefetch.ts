import { readFileSync } from "node:fs";
import path from "node:path";

import { Router } from "express";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { getTermsSSRHtml } from "@web-speed-hackathon-2026/server/src/ssr/terms";

export const prefetchRouter = Router();

let headPart: string | null = null;
let bodyPart: string | null = null;
const htmlCache = new Map<string, string>();

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

  // Home: find first post with images, preload its first image
  const postsKey = "/api/v1/posts?limit=30&offset=0";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = data[postsKey] as any[] | undefined;
  if (posts && posts.length > 0) {
    // Preload first movie poster (video is often LCP element)
    const postWithMovie = posts.find((p: any) => p.movie);
    if (postWithMovie) {
      links.push(`<link rel="preload" as="image" href="/movies/${postWithMovie.movie.id}.poster.avif" fetchpriority="high">`);
    }
    // Preload first image
    const postWithImage = posts.find((p: any) => p.images && p.images.length > 0);
    if (postWithImage) {
      const firstImg = postWithImage.images[0];
      links.push(`<link rel="preload" as="image" href="/images/${firstImg.id}.avif" fetchpriority="high">`);
    }
    const profileImg = posts[0]?.user?.profileImage;
    if (profileImg) {
      links.push(`<link rel="preload" as="image" href="/images/profiles/${profileImg.id}.avif">`);
    }
  }

  // Post detail: movie poster or first image
  const postMatch = urlPath.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const post = data[`/api/v1/posts/${postMatch[1]}`] as any;
    if (post?.movie) {
      links.push(`<link rel="preload" as="image" href="/movies/${post.movie.id}.poster.avif" fetchpriority="high">`);
    }
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

    // キャッシュヒット: 即座に返却
    const cached = htmlCache.get(req.path);
    if (cached) {
      return res.send(cached);
    }

    // /terms: Full SSR with no JS — eliminates TBT entirely
    if (req.path === "/terms") {
      const ssrContent = getTermsSSRHtml();
      // Strip all <script> and modulepreload tags from BOTH head and body
      const stripScripts = (html: string) => html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, "");
      const cleanHead = stripScripts(headPart!);
      const cleanBody = stripScripts(bodyPart!)
        .replace(/<div id="app-loader"[^>]*>[^<]*<\/div>/, ssrContent);
      const fullHtml = cleanHead + cleanBody;
      htmlCache.set(req.path, fullHtml);
      return res.send(fullHtml);
    }

    // キャッシュミス: head を先にストリーミングしてブラウザにCSS/JSダウンロードを開始させる
    res.write(headPart);

    const prefetchData = await getPrefetchData(req.path, req.session.userId);
    const lcpPreloads = extractLcpPreloads(prefetchData, req.path);

    // LCP hero image for home
    let heroImgTag = "";
    if (req.path === "/" || req.path === "") {
      const posts = prefetchData["/api/v1/posts?limit=30&offset=0"] as any[] | undefined;
      if (posts && posts.length > 0) {
        const postWithMovie = posts.find((p: any) => p.movie);
        if (postWithMovie) {
          heroImgTag = `<img id="lcp-hero" src="/movies/${postWithMovie.movie.id}.poster.avif" fetchpriority="high" loading="eager" style="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none" alt="">`;
        } else {
          const postWithImage = posts.find((p: any) => p.images?.length > 0);
          if (postWithImage) {
            heroImgTag = `<img id="lcp-hero" src="/images/${postWithImage.images[0].id}.avif" fetchpriority="high" loading="eager" style="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none" alt="">`;
          }
        }
      }
    }

    const tailHtml = lcpPreloads +
      (Object.keys(prefetchData).length > 0
        ? `<script>window.__PREFETCH__=${JSON.stringify(prefetchData)}</script>`
        : "") +
      heroImgTag +
      bodyPart;

    res.write(tailHtml);
    res.end();

    // 次回リクエスト用にキャッシュ保存
    htmlCache.set(req.path, headPart + tailHtml);
  } catch {
    if (res.headersSent) {
      res.write(bodyPart);
      return res.end();
    }
    return next();
  }
});

export async function warmHtmlCache(): Promise<void> {
  loadHtmlParts();
  const prefetchData = await getPrefetchData("/");
  const lcpPreloads = extractLcpPreloads(prefetchData, "/");

  let heroImgTag = "";
  const posts = prefetchData["/api/v1/posts?limit=30&offset=0"] as any[] | undefined;
  if (posts && posts.length > 0) {
    const postWithMovie = posts.find((p: any) => p.movie);
    if (postWithMovie) {
      heroImgTag = `<img id="lcp-hero" src="/movies/${postWithMovie.movie.id}.poster.avif" fetchpriority="high" loading="eager" style="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none" alt="">`;
    } else {
      const postWithImage = posts.find((p: any) => p.images?.length > 0);
      if (postWithImage) {
        heroImgTag = `<img id="lcp-hero" src="/images/${postWithImage.images[0].id}.avif" fetchpriority="high" loading="eager" style="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none" alt="">`;
      }
    }
  }

  const fullHtml = headPart + lcpPreloads +
    (Object.keys(prefetchData).length > 0
      ? `<script>window.__PREFETCH__=${JSON.stringify(prefetchData)}</script>`
      : "") +
    heroImgTag +
    bodyPart;
  htmlCache.set("/", fullHtml);
}

export function clearHtmlCache(): void {
  htmlCache.clear();
}