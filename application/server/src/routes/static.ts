import history from "connect-history-api-fallback";
import fs from "node:fs";
import { Router } from "express";
import serveStatic from "serve-static";
import path from "node:path";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();
const clientIndexHtml = fs.readFileSync(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");

function setStaticCacheControl(
  res: Parameters<NonNullable<serveStatic.ServeStaticOptions["setHeaders"]>>[0],
  filePath: string,
) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);
  const relativePublicPath = filePath.startsWith(PUBLIC_PATH)
    ? path.relative(PUBLIC_PATH, filePath)
    : null;

  if (basename === "index.html") {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return;
  }

  if (/^chunk-[0-9a-f]+\.js(?:\.LICENSE\.txt)?$/.test(basename)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  if (filePath.startsWith(UPLOAD_PATH)) {
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mp3", ".wav"].includes(ext)) {
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      return;
    }
  }

  if (filePath.startsWith(PUBLIC_PATH) || filePath.startsWith(CLIENT_DIST_PATH)) {
    if (relativePublicPath?.startsWith("dicts/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return;
    }

    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".webm", ".woff", ".woff2", ".ttf"].includes(ext)) {
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      return;
    }
  }

  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
}

async function renderHomeIndexHtml(): Promise<string> {
  const posts = await Post.findAll({
    limit: 8,
  });
  const firstMovie = posts
    .map((post) => post.get("movie") as { id: string } | null)
    .find((movie) => movie != null);
  if (firstMovie == null) {
    return clientIndexHtml;
  }

  const preloadTag = `<link rel="preload" as="image" href="/movies/${firstMovie.id}.jpg" fetchpriority="high" />`;
  return clientIndexHtml.replace("</head>", `    ${preloadTag}\n  </head>`);
}

staticRouter.get("/", async (_req, res, next) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.type("html").send(await renderHomeIndexHtml());
  } catch (error) {
    next(error);
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: setStaticCacheControl,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: setStaticCacheControl,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setStaticCacheControl,
  }),
);
