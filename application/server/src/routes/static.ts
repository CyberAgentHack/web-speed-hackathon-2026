import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { imageResizeMiddleware } from "@web-speed-hackathon-2026/server/src/routes/image-resize";

export const staticRouter = Router();

// Image resize middleware (before static serving)
staticRouter.use(imageResizeMiddleware);

// Serve uploaded files and public assets first
staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
  }),
);

// Serve non-HTML static assets from client dist (JS, CSS, fonts, etc.)
// Use index: false to prevent serving index.html for "/" — we handle that below
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// Read the HTML template — cache in production, reload every request in development
let htmlTemplate: string | null = null;
function getHtmlTemplate(): string | null {
  if (process.env["NODE_ENV"] === "production" && htmlTemplate != null) {
    return htmlTemplate;
  }
  try {
    htmlTemplate = fs.readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");
    return htmlTemplate;
  } catch {
    return null;
  }
}

// --- Home HTML cache (Change 1) ---
// Dedup concurrent requests with a shared promise
let cachedHomeHtml: string | null = null;
let homeBuildPromise: Promise<string> | null = null;

async function buildHomeHtml(baseHtml: string): Promise<string> {
  const initialData: Record<string, unknown> = {};
  const preloadLinks: string[] = [];

  const { Post } = await import("@web-speed-hackathon-2026/server/src/models");
  const { computeWaveform } = await import("@web-speed-hackathon-2026/server/src/routes/api/sound");

  const posts = await Post.findAll({ limit: 30, offset: 0 });
  const postsJson = posts.map((p) => p.toJSON());

  await Promise.all(
    postsJson.map(async (post) => {
      const sound = (post as Record<string, unknown>)["sound"] as { id: string } | null | undefined;
      if (sound) {
        try {
          (sound as Record<string, unknown>)["waveform"] = await computeWaveform(sound.id);
        } catch {
          // skip if waveform computation fails
        }
      }
    }),
  );

  initialData["/api/v1/posts?limit=30&offset=0"] = postsJson;

  // Find the first post with images for LCP preload
  for (const post of postsJson) {
    const images = (post as Record<string, unknown>)["images"] as Array<{ id: string }> | undefined;
    if (images && images.length > 0) {
      const firstImageId = images[0]!.id;
      preloadLinks.push(
        `<link rel="preload" as="image" href="/images/${firstImageId}.webp?w=686" fetchpriority="high">`,
      );
      break;
    }
  }

  let injectedHtml = baseHtml;

  if (preloadLinks.length > 0) {
    injectedHtml = injectedHtml.replace("</head>", `${preloadLinks.join("\n")}\n</head>`);
  }

  if (Object.keys(initialData).length > 0) {
    const script = `<script>window.__INITIAL_DATA__=${JSON.stringify(initialData)}</script>`;
    injectedHtml = injectedHtml.replace("</head>", `${script}\n</head>`);
  }

  return injectedHtml;
}

async function getHomeHtml(baseHtml: string): Promise<string> {
  if (cachedHomeHtml) return cachedHomeHtml;
  if (homeBuildPromise) return homeBuildPromise;

  homeBuildPromise = buildHomeHtml(baseHtml)
    .then((html) => {
      cachedHomeHtml = html;
      homeBuildPromise = null;
      return html;
    })
    .catch((err) => {
      homeBuildPromise = null;
      throw err;
    });

  return homeBuildPromise;
}

export function clearHomeCache(): void {
  cachedHomeHtml = null;
  homeBuildPromise = null;
}

export async function warmHomeCache(): Promise<void> {
  const html = getHtmlTemplate();
  if (html == null) return;
  clearHomeCache();
  await getHomeHtml(html);
}

// --- Route-specific initial data injection (Change 2) ---
async function buildRouteHtml(
  baseHtml: string,
  reqPath: string,
  query: Record<string, unknown>,
): Promise<string> {
  const initialData: Record<string, unknown> = {};

  try {
    const postDetailMatch = reqPath.match(/^\/posts\/([^/]+)$/);
    const userProfileMatch = reqPath.match(/^\/users\/([^/]+)$/);

    if (postDetailMatch) {
      const postId = postDetailMatch[1];
      const { Post, Comment } = await import("@web-speed-hackathon-2026/server/src/models");
      const { computeWaveform } =
        await import("@web-speed-hackathon-2026/server/src/routes/api/sound");

      const post = await Post.findByPk(postId);
      if (post) {
        const postJson = post.toJSON() as Record<string, unknown>;
        const sound = postJson["sound"] as { id: string } | null | undefined;
        if (sound) {
          try {
            (sound as Record<string, unknown>)["waveform"] = await computeWaveform(sound.id);
          } catch {
            /* skip */
          }
        }
        initialData[`/api/v1/posts/${postId}`] = postJson;

        const comments = await Comment.findAll({
          limit: 30,
          offset: 0,
          where: { postId },
        });
        initialData[`/api/v1/posts/${postId}/comments?limit=30&offset=0`] = comments.map((c) =>
          c.toJSON(),
        );
      }
    } else if (userProfileMatch) {
      const username = userProfileMatch[1];
      const { User, Post } = await import("@web-speed-hackathon-2026/server/src/models");
      const { computeWaveform } =
        await import("@web-speed-hackathon-2026/server/src/routes/api/sound");

      const user = await User.findOne({ where: { username } });
      if (user) {
        initialData[`/api/v1/users/${username}`] = user.toJSON();

        const posts = await Post.findAll({
          limit: 30,
          offset: 0,
          where: { userId: user.id },
        });
        const postsJson = posts.map((p) => p.toJSON());
        await Promise.all(
          postsJson.map(async (post) => {
            const sound = (post as Record<string, unknown>)["sound"] as
              | { id: string }
              | null
              | undefined;
            if (sound) {
              try {
                (sound as Record<string, unknown>)["waveform"] = await computeWaveform(sound.id);
              } catch {
                /* skip */
              }
            }
          }),
        );
        initialData[`/api/v1/users/${username}/posts?limit=30&offset=0`] = postsJson;
      }
    } else if (
      reqPath === "/search" &&
      typeof query["q"] === "string" &&
      query["q"].trim() !== ""
    ) {
      const { Op } = await import("sequelize");
      const { Post } = await import("@web-speed-hackathon-2026/server/src/models");
      const { parseSearchQuery } =
        await import("@web-speed-hackathon-2026/server/src/utils/parse_search_query.js");

      const q = query["q"] as string;
      const { keywords, sinceDate, untilDate } = parseSearchQuery(q);

      if (keywords || sinceDate || untilDate) {
        const searchTerm = keywords ? `%${keywords}%` : null;
        const dateConditions: Record<symbol, Date>[] = [];
        if (sinceDate) dateConditions.push({ [Op.gte]: sinceDate });
        if (untilDate) dateConditions.push({ [Op.lte]: untilDate });
        const dateWhere =
          dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

        const whereConditions: Record<string, unknown>[] = [];
        if (searchTerm) {
          whereConditions.push({
            [Op.or]: [
              { text: { [Op.like]: searchTerm } },
              { "$user.username$": { [Op.like]: searchTerm } },
              { "$user.name$": { [Op.like]: searchTerm } },
            ],
          });
        }
        if (Object.keys(dateWhere).length > 0) {
          whereConditions.push(dateWhere);
        }

        const matchingRows = await Post.unscoped().findAll({
          attributes: ["id"],
          include: [{ association: "user", attributes: [], required: false }],
          where: whereConditions.length > 0 ? { [Op.and]: whereConditions } : {},
          limit: 30,
          offset: 0,
          order: [["createdAt", "DESC"]],
          subQuery: false,
          raw: true,
        });

        const ids = matchingRows.map((r: { id: string }) => r.id);
        const posts = ids.length > 0 ? await Post.findAll({ where: { id: { [Op.in]: ids } } }) : [];
        posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const encodedQ = encodeURIComponent(q);
        initialData[`/api/v1/search?q=${encodedQ}&limit=30&offset=0`] = posts.map((p) =>
          p.toJSON(),
        );
      }
    }
  } catch {
    // If data fetch fails, serve HTML without initial data
  }

  if (Object.keys(initialData).length === 0) {
    return baseHtml;
  }

  const script = `<script>window.__INITIAL_DATA__=${JSON.stringify(initialData)}</script>`;
  return baseHtml.replace("</head>", `${script}\n</head>`);
}

// SPA fallback: serve index.html with injected initial data for all page routes
staticRouter.use(async (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  // Skip API routes (handled by apiRouter before staticRouter)
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Skip requests that have file extensions (real static files that weren't found)
  if (req.path !== "/" && /\.\w+$/.test(req.path)) {
    return next();
  }

  const html = getHtmlTemplate();
  if (html == null) {
    return next();
  }

  let responseHtml: string;

  try {
    if (req.path === "/" || req.path === "/index.html") {
      responseHtml = await getHomeHtml(html);
    } else {
      responseHtml = await buildRouteHtml(html, req.path, req.query as Record<string, unknown>);
    }
  } catch {
    responseHtml = html;
  }

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache");
  res.send(responseHtml);
});
