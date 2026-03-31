import fs from "node:fs/promises";
import path from "node:path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic, { type ServeStaticOptions } from "serve-static";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const INITIAL_TIMELINE_LIMIT = 30;
const INDEX_HTML_PATH = path.resolve(CLIENT_DIST_PATH, "index.html");
const APP_BOOT_PREVIEW_PLACEHOLDER = "<!--app-boot-preview-->";
const INITIAL_DATA_SCRIPT_PLACEHOLDER =
  '<script id="initial-data-script">window.__INITIAL_DATA__ = {};</script>';

let cachedIndexHtml: string | null = null;

const setCacheControl = (cacheControl: string): NonNullable<ServeStaticOptions["setHeaders"]> => {
  return (res) => {
    res.setHeader("Cache-Control", cacheControl);
  };
};

const setDistHeaders: NonNullable<ServeStaticOptions["setHeaders"]> = (res, filePath) => {
  if (path.basename(filePath) === "index.html") {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  res.setHeader("Cache-Control", `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`);
};

function serializeInitialData(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

async function readIndexHtml() {
  if (cachedIndexHtml !== null) {
    return cachedIndexHtml;
  }

  cachedIndexHtml = await fs.readFile(INDEX_HTML_PATH, "utf8");
  return cachedIndexHtml;
}

function injectInitialData(indexHtml: string, data: Record<string, unknown>) {
  const initialDataScript = `<script id="initial-data-script">window.__INITIAL_DATA__=${serializeInitialData(data)};</script>`;

  if (!indexHtml.includes(INITIAL_DATA_SCRIPT_PLACEHOLDER)) {
    console.warn("initial data placeholder was not found in index.html");
    return indexHtml;
  }

  return indexHtml.replace(INITIAL_DATA_SCRIPT_PLACEHOLDER, initialDataScript);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBootPreviewMedia(post: Record<string, any>, prioritizeMedia: boolean) {
  if (Array.isArray(post["images"]) && post["images"].length > 0) {
    const firstImage = post["images"][0];
    if (firstImage?.id) {
      return `
        <div class="app-boot-preview__media">
          <img
            alt="${escapeHtml(String(firstImage.alt ?? ""))}"
            src="/images/${escapeHtml(String(firstImage.id))}.jpg"
            ${prioritizeMedia ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'}
          />
        </div>
      `;
    }
  }

  if (post["movie"]?.id) {
    return `
      <div class="app-boot-preview__media">
        <div class="app-boot-preview__media-placeholder">GIF POST</div>
      </div>
    `;
  }

  if (post["sound"]?.id) {
    return `
      <div class="app-boot-preview__media">
        <div class="app-boot-preview__media-placeholder">AUDIO POST</div>
      </div>
    `;
  }

  return "";
}

function renderHomeBootPreview(posts: Post[]) {
  const previewPosts = posts
    .map((post) => post.toJSON() as Record<string, any>)
    .slice(0, 5)
    .map((post, idx) => {
      const profileImageId = String(post["user"]?.profileImage?.id ?? "");
      const profileImageAlt = escapeHtml(String(post["user"]?.profileImage?.alt ?? ""));
      const name = escapeHtml(String(post["user"]?.name ?? ""));
      const username = escapeHtml(String(post["user"]?.username ?? ""));
      const text = escapeHtml(String(post["text"] ?? ""));
      const createdAt = escapeHtml(String(post["createdAt"] ?? ""));

      return `
        <div class="app-boot-preview__post">
          <img
            alt="${profileImageAlt}"
            class="app-boot-preview__avatar"
            src="/images/profiles/${escapeHtml(profileImageId)}.jpg"
            ${idx === 0 ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'}
            width="64"
            height="64"
          />
          <div class="app-boot-preview__content">
            <p class="app-boot-preview__meta">
              <span class="app-boot-preview__author">${name}</span>
              <span>@${username}</span>
              <span> - ${createdAt}</span>
            </p>
            <p class="app-boot-preview__text">${text}</p>
            ${renderBootPreviewMedia(post, idx === 0)}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div aria-hidden="true" class="app-boot-preview">
      <div class="app-boot-preview__frame">
        <aside class="app-boot-preview__sidebar">
          <span class="app-boot-preview__nav-item">ホーム</span>
          <span class="app-boot-preview__nav-item">検索</span>
          <span class="app-boot-preview__nav-item">サインイン</span>
          <span class="app-boot-preview__nav-item">利用規約</span>
        </aside>
        <main class="app-boot-preview__main">
          ${previewPosts}
        </main>
      </div>
    </div>
  `;
}

function injectBootPreview(indexHtml: string, previewHtml: string) {
  if (!indexHtml.includes(APP_BOOT_PREVIEW_PLACEHOLDER)) {
    return indexHtml;
  }

  return indexHtml.replace(APP_BOOT_PREVIEW_PLACEHOLDER, previewHtml);
}

staticRouter.get(["/", "/index.html"], async (_req, res, next) => {
  let indexHtml: string;

  try {
    indexHtml = await readIndexHtml();
  } catch (error) {
    return next(error);
  }

  try {
    const posts = await Post.findAll({ limit: INITIAL_TIMELINE_LIMIT, offset: 0 });
    const injectedHtml = injectBootPreview(
      injectInitialData(indexHtml, { "/api/v1/posts": posts }),
      renderHomeBootPreview(posts),
    );

    return res.status(200).setHeader("Cache-Control", "no-cache").type("html").send(injectedHtml);
  } catch (error) {
    console.error(error);
    return res.status(200).setHeader("Cache-Control", "no-cache").type("html").send(indexHtml);
  }
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    maxAge: `${ONE_YEAR_IN_SECONDS}s`,
    immutable: true,
    setHeaders: setCacheControl(`public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`),
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    maxAge: `${ONE_DAY_IN_SECONDS}s`,
    setHeaders: setCacheControl(`public, max-age=${ONE_DAY_IN_SECONDS}`),
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    setHeaders: setDistHeaders,
  }),
);
