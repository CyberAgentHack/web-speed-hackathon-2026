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

staticRouter.get(["/", "/index.html"], async (_req, res, next) => {
  let indexHtml: string;

  try {
    indexHtml = await readIndexHtml();
  } catch (error) {
    return next(error);
  }

  try {
    const posts = await Post.findAll({ limit: INITIAL_TIMELINE_LIMIT, offset: 0 });
    const injectedHtml = injectInitialData(indexHtml, { "/api/v1/posts": posts });

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
