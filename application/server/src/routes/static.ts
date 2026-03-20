import type { ServerResponse } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { createPostPayloadQuery } from "@web-speed-hackathon-2026/server/src/routes/api/post_payloads";
import { renderIndexDocument } from "@web-speed-hackathon-2026/server/src/utils/render_index_document";
import { AppBootstrapData } from "@web-speed-hackathon-2026/client/src/bootstrap";

export const staticRouter = Router();

const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
const HOME_INITIAL_POST_LIMIT = 6;

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function createPreloadLink({
  as,
  href,
  type,
}: {
  as: "fetch" | "font" | "image" | "video";
  href: string;
  type?: string;
}) {
  const attributes = [
    'rel="preload"',
    `as="${as}"`,
    `href="${escapeHtmlAttribute(href)}"`,
  ];
  if (type != null) {
    attributes.push(`type="${escapeHtmlAttribute(type)}"`);
  }
  if (as === "font") {
    attributes.push('crossorigin="anonymous"');
  }
  return `<link ${attributes.join(" ")}>`;
}

function buildHomePreloadTags(posts: Models.Post[]) {
  const firstPost = posts[0];
  if (firstPost == null) {
    return "";
  }

  const preloadLinks = new Set<string>();
  preloadLinks.add(
    createPreloadLink({
      as: "image",
      href: `/images/profiles/${firstPost.user.profileImage.id}`,
    }),
  );

  if (firstPost.images?.length > 0) {
    preloadLinks.add(
      createPreloadLink({
        as: "image",
        href: `/images/${firstPost.images[0]!.id}`,
      }),
    );
  } else if (firstPost.movie != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "video",
        href: `/movies/${firstPost.movie.id}.mp4`,
        type: "video/mp4",
      }),
    );
  } else if (firstPost.sound != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "fetch",
        href: `/waveforms/${firstPost.sound.id}.json`,
        type: "application/json",
      }),
    );
  }

  return Array.from(preloadLinks).join("");
}

async function resolveFirstExistingPath(paths: string[]) {
  for (const filePath of paths) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      continue;
    }
  }

  return null;
}

async function resolveImagePath({
  acceptHeader,
  relativePath,
}: {
  acceptHeader: string | undefined;
  relativePath: string;
}) {
  const prefersAvif = acceptHeader?.includes("image/avif") ?? false;
  const extensions = prefersAvif ? ["avif", "jpg"] : ["jpg", "avif"];

  return await resolveFirstExistingPath([
    ...extensions.map((extension) => path.resolve(UPLOAD_PATH, `${relativePath}.${extension}`)),
    ...extensions.map((extension) => path.resolve(PUBLIC_PATH, `${relativePath}.${extension}`)),
  ]);
}

async function resolveMediaPath({
  extensions,
  relativePath,
}: {
  extensions: string[];
  relativePath: string;
}) {
  return await resolveFirstExistingPath([
    ...extensions.map((extension) => path.resolve(UPLOAD_PATH, `${relativePath}.${extension}`)),
    ...extensions.map((extension) => path.resolve(PUBLIC_PATH, `${relativePath}.${extension}`)),
  ]);
}

function setStaticHeaders(res: ServerResponse, filePath: string) {
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  if (filePath.startsWith(path.join(CLIENT_DIST_PATH, "scripts")) || filePath.startsWith(path.join(CLIENT_DIST_PATH, "styles"))) {
    res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
    return;
  }

  if (
    filePath.startsWith(UPLOAD_PATH) ||
    filePath.startsWith(path.join(PUBLIC_PATH, "images")) ||
    filePath.startsWith(path.join(PUBLIC_PATH, "movies")) ||
    filePath.startsWith(path.join(PUBLIC_PATH, "waveforms")) ||
    filePath.startsWith(path.join(PUBLIC_PATH, "sounds")) ||
    filePath.endsWith(".avif")
  ) {
    res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=3600");
}

staticRouter.get("/images/profiles/:profileImageId", async (req, res, next) => {
  const filePath = await resolveImagePath({
    acceptHeader: req.headers.accept,
    relativePath: `images/profiles/${req.params.profileImageId}`,
  });

  if (filePath == null) {
    next();
    return;
  }

  res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  res.sendFile(filePath);
});

staticRouter.get("/images/:imageId", async (req, res, next) => {
  const filePath = await resolveImagePath({
    acceptHeader: req.headers.accept,
    relativePath: `images/${req.params.imageId}`,
  });

  if (filePath == null) {
    next();
    return;
  }

  res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  res.sendFile(filePath);
});

staticRouter.get("/sounds/:soundId", async (req, res, next) => {
  const filePath = await resolveMediaPath({
    extensions: ["ogg", "mp3"],
    relativePath: `sounds/${req.params.soundId}`,
  });

  if (filePath == null) {
    next();
    return;
  }

  res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  res.sendFile(filePath);
});

staticRouter.get("/", async (_req, res, next) => {
  try {
    const posts = await Post.unscoped().findAll(createPostPayloadQuery({ limit: HOME_INITIAL_POST_LIMIT }));
    const initialTimelinePosts = JSON.parse(
      JSON.stringify(posts),
    ) as NonNullable<AppBootstrapData["initialTimelinePosts"]>;
    const html = await renderIndexDocument({
      bootstrap: { initialTimelinePosts },
      headTags: buildHomePreloadTags(initialTimelinePosts),
      title: "タイムライン - CaX",
    });

    res.setHeader("Cache-Control", "no-cache");
    res.status(200).type("text/html").send(html);
  } catch (error) {
    next(error);
  }
});

staticRouter.get("/terms", async (_req, res, next) => {
  try {
    const html = await renderIndexDocument({
      headTags: createPreloadLink({
        as: "font",
        href: "/fonts/ReiNoAreMincho-Heading-Bold.woff2",
        type: "font/woff2",
      }),
      title: "利用規約 - CaX",
    });

    res.setHeader("Cache-Control", "no-cache");
    res.status(200).type("text/html").send(html);
  } catch (error) {
    next(error);
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    setHeaders: setStaticHeaders,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    setHeaders: setStaticHeaders,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setStaticHeaders,
  }),
);
