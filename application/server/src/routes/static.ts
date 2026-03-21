import { readFile } from "node:fs/promises";
import path from "node:path";

import history from "connect-history-api-fallback";
import { type Request, type Response, Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import {
  buildSsrInfiniteCacheKey,
  getSsrFirstPagePath,
  renderAppSsr,
  type SsrFallback,
} from "@web-speed-hackathon-2026/server/src/routes/ssr";
import {
  buildSsrCacheKey,
  getCachedSsrHtml,
  getSsrCacheTags,
  setCachedSsrHtml,
} from "@web-speed-hackathon-2026/server/src/routes/ssr_cache";

export const staticRouter = Router();

const CLIENT_INDEX_HTML_PATH = path.join(CLIENT_DIST_PATH, "index.html");

let clientIndexHtmlCache: string | null = null;

function safeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function replaceAppRoot(
  indexHtml: string,
  appHtml: string,
  bootstrapScript: string,
): string {
  const target = '<div id="app"></div>';
  const replacement = `<div id="app">${appHtml}</div>\n    ${bootstrapScript}`;
  return indexHtml.includes(target)
    ? indexHtml.replace(target, replacement)
    : indexHtml;
}

async function readClientIndexHtml(): Promise<string> {
  if (clientIndexHtmlCache != null) {
    return clientIndexHtmlCache;
  }

  clientIndexHtmlCache = await readFile(CLIENT_INDEX_HTML_PATH, "utf-8");
  return clientIndexHtmlCache;
}

function getInternalApiOrigin(req: Request): string | null {
  const localPort = req.socket.localPort;
  if (localPort == null) {
    return null;
  }

  // SSR の事前フェッチはループバック固定にして外部ネットワークへ出さない
  return `http://127.0.0.1:${localPort}`;
}

async function fetchSsrJson<T>(
  req: Request,
  apiPath: string,
): Promise<T | undefined> {
  try {
    const origin = getInternalApiOrigin(req);
    if (origin == null) {
      return undefined;
    }

    const response = await fetch(new URL(apiPath, origin), {
      headers: {
        cookie: req.headers.cookie ?? "",
      },
      method: "GET",
    });

    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

async function buildSsrFallback(
  req: Request,
  activeUser: Models.User | null,
): Promise<SsrFallback> {
  const fallback: SsrFallback = {
    "/api/v1/me": activeUser,
  };

  const location = req.originalUrl || req.url;
  const url = new URL(location, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/") {
    const apiPath = "/api/v1/posts";
    const homeLimit = 10;
    const firstPage = await fetchSsrJson<Models.Post[]>(
      req,
      getSsrFirstPagePath(apiPath, homeLimit),
    );
    if (firstPage !== undefined) {
      fallback[getSsrFirstPagePath(apiPath, homeLimit)] = firstPage;
      fallback[buildSsrInfiniteCacheKey(apiPath, homeLimit)] = [firstPage];
    }
  }

  const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
  if (postMatch?.[1] != null) {
    const postId = postMatch[1];
    const postApiPath = `/api/v1/posts/${postId}`;
    const commentsApiPath = `/api/v1/posts/${postId}/comments`;

    const [post, commentsFirstPage] = await Promise.all([
      fetchSsrJson<Models.Post>(req, postApiPath),
      fetchSsrJson<Models.Comment[]>(req, getSsrFirstPagePath(commentsApiPath)),
    ]);

    if (post !== undefined) {
      fallback[postApiPath] = post;
    }

    if (commentsFirstPage !== undefined) {
      fallback[getSsrFirstPagePath(commentsApiPath)] = commentsFirstPage;
      fallback[buildSsrInfiniteCacheKey(commentsApiPath)] = [commentsFirstPage];
    }
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch?.[1] != null) {
    const username = userMatch[1];
    const userApiPath = `/api/v1/users/${username}`;
    const postsApiPath = `/api/v1/users/${username}/posts`;

    const [user, postsFirstPage] = await Promise.all([
      fetchSsrJson<Models.User>(req, userApiPath),
      fetchSsrJson<Models.Post[]>(req, getSsrFirstPagePath(postsApiPath)),
    ]);

    if (user !== undefined) {
      fallback[userApiPath] = user;
    }

    if (postsFirstPage !== undefined) {
      fallback[getSsrFirstPagePath(postsApiPath)] = postsFirstPage;
      fallback[buildSsrInfiniteCacheKey(postsApiPath)] = [postsFirstPage];
    }
  }

  if (pathname === "/search") {
    const query = url.searchParams.get("q") ?? "";
    if (query !== "") {
      const searchApiPath = `/api/v1/search?q=${encodeURIComponent(query)}`;
      const searchLimit = 30;
      const postsFirstPage = await fetchSsrJson<Models.Post[]>(
        req,
        getSsrFirstPagePath(searchApiPath, searchLimit),
      );

      if (postsFirstPage !== undefined) {
        fallback[getSsrFirstPagePath(searchApiPath, searchLimit)] =
          postsFirstPage;
        fallback[buildSsrInfiniteCacheKey(searchApiPath, searchLimit)] = [
          postsFirstPage,
        ];
      }
    }
  }

  return fallback;
}

const isAppRoute = (path: string): boolean => {
  return (
    path === "/" ||
    /^\/posts\/[^/]+$/.test(path) ||
    /^\/users\/[^/]+$/.test(path) ||
    path === "/search" ||
    path === "/terms" ||
    path === "/crok" ||
    path === "/dm" ||
    /^\/dm\/[^/]+$/.test(path)
  );
};

/**
 * 全ページ対応の汎用 SSR middleware
 * /posts/:postId 以外のページを SSR する
 */
staticRouter.use(async (req: Request, res: Response, next) => {
  // 静的ファイルは処理をスキップ
  if (!isAppRoute(req.path)) {
    return next();
  }

  const location = req.originalUrl || req.url;
  const activeUser = (req as any).user ?? null;
  const activeUserId = activeUser?.id ?? null;
  const cacheKey = buildSsrCacheKey({ location, activeUserId });

  const cachedHtml = getCachedSsrHtml(cacheKey);
  if (cachedHtml != null) {
    res.setHeader("X-SSR-Cache", "HIT");
    return res.status(200).type("text/html").send(cachedHtml);
  }

  try {
    const indexHtml = await readClientIndexHtml();
    const swrFallback = await buildSsrFallback(req, activeUser);

    const appHtml = renderAppSsr({
      location: req.originalUrl || req.url,
      activeUser,
      swrFallback,
    });

    // SWR キャッシュの初期化スクリプトを埋め込む
    const swrCacheScript = `<script id="swr-cache" type="application/json">${
      safeJsonForInlineScript(swrFallback)
    }</script>`;

    const html = replaceAppRoot(indexHtml, appHtml, swrCacheScript);

    setCachedSsrHtml({
      cacheKey,
      html,
      tags: getSsrCacheTags({ location, activeUserId }),
    });

    res.setHeader("X-SSR-Cache", "MISS");

    res.status(200).type("text/html").send(html);
  } catch (err) {
    // SSR 失敗時は next() で SPA fallback に任せる
    next(err);
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(serveStatic(UPLOAD_PATH));
staticRouter.use(serveStatic(PUBLIC_PATH));
staticRouter.use(serveStatic(CLIENT_DIST_PATH));
