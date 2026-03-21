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
import { renderAppHtml } from "@web-speed-hackathon-2026/server/src/utils/render_app_html";
import { renderIndexDocument } from "@web-speed-hackathon-2026/server/src/utils/render_index_document";
import { renderTermsAppHtml } from "@web-speed-hackathon-2026/server/src/utils/render_terms_app_html";
import { AppBootstrapData } from "@web-speed-hackathon-2026/client/src/bootstrap";

export const staticRouter = Router();

const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
const HOME_INITIAL_POST_LIMIT = 3;
const STATIC_HTML_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";

let cachedTermsDocumentPromise: Promise<string> | null = null;

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

  const firstMediaPost = posts.find((post) => {
    return (post.images?.length ?? 0) > 0 || post.movie != null || post.sound != null;
  });
  const firstImage = firstMediaPost?.images?.[0];
  const firstMovie = firstMediaPost?.movie;
  const firstSound = firstMediaPost?.sound;

  if (firstImage != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "image",
        href: `/images/${firstImage.id}`,
      }),
    );
  } else if (firstMovie != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "image",
        href: `/movies/${firstMovie.id}.jpg`,
        type: "image/jpeg",
      }),
    );
  } else if (firstSound != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "fetch",
        href: `/waveforms/${firstSound.id}.json`,
        type: "application/json",
      }),
    );
  }

  return Array.from(preloadLinks).join("");
}

function buildPostPreloadTags(post: Models.Post) {
  const preloadLinks = new Set<string>();

  if (post.user.profileImage.id != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "image",
        href: `/images/profiles/${post.user.profileImage.id}`,
      }),
    );
  }

  const firstImage = post.images?.[0];
  const movie = post.movie;
  const sound = post.sound;

  if (firstImage != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "image",
        href: `/images/${firstImage.id}`,
      }),
    );
  } else if (movie != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "image",
        href: `/movies/${movie.id}.jpg`,
        type: "image/jpeg",
      }),
    );
  } else if (sound != null) {
    preloadLinks.add(
      createPreloadLink({
        as: "fetch",
        href: `/waveforms/${sound.id}.json`,
        type: "application/json",
      }),
    );
  }

  return Array.from(preloadLinks).join("");
}

async function buildTermsDocument() {
  return await renderIndexDocument({
    appHtml: await renderTermsAppHtml(),
    headTags: createPreloadLink({
      as: "font",
      href: "/fonts/ReiNoAreMincho-Heading-Bold.woff2",
      type: "font/woff2",
    }),
    scriptLoading: "idle",
    title: "利用規約 - CaX",
  });
}

async function getTermsDocument() {
  if (cachedTermsDocumentPromise != null) {
    return await cachedTermsDocumentPromise;
  }

  cachedTermsDocumentPromise = buildTermsDocument().catch((error) => {
    cachedTermsDocumentPromise = null;
    throw error;
  });

  return await cachedTermsDocumentPromise;
}

void getTermsDocument().catch(() => {
  // 初回リクエスト前に prewarm したいが、失敗しても route で再試行させる。
});

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
    const bootstrap = { initialTimelinePosts } satisfies AppBootstrapData;
    const html = await renderIndexDocument({
      appHtml: await renderAppHtml({
        bootstrap,
        pathname: "/",
      }),
      bootstrap,
      headTags: buildHomePreloadTags(initialTimelinePosts),
      title: "タイムライン - CaX",
    });

    res.setHeader("Cache-Control", "no-cache");
    res.status(200).type("text/html").send(html);
  } catch (error) {
    next(error);
  }
});

staticRouter.get("/posts/:postId", async (req, res, next) => {
  try {
    const post = await Post.unscoped().findOne(
      createPostPayloadQuery({
        where: {
          id: req.params.postId,
        },
      }),
    );

    if (post == null) {
      next();
      return;
    }

    const initialPost = JSON.parse(JSON.stringify(post)) as NonNullable<AppBootstrapData["initialPost"]>;
    const bootstrap = { initialPost } satisfies AppBootstrapData;
    const html = await renderIndexDocument({
      appHtml: await renderAppHtml({
        bootstrap,
        pathname: req.path,
      }),
      bootstrap,
      headTags: buildPostPreloadTags(initialPost),
      title: `${initialPost.user.name} さんのつぶやき - CaX`,
    });

    res.setHeader("Cache-Control", "no-cache");
    res.status(200).type("text/html").send(html);
  } catch (error) {
    next(error);
  }
});

staticRouter.get("/terms", async (_req, res, next) => {
  try {
    const html = await getTermsDocument();

    res.setHeader("Cache-Control", STATIC_HTML_CACHE_CONTROL);
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
