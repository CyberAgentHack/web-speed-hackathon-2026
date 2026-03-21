import { readFileSync } from "fs";
import path from "path";

import { Request, Response, Router } from "express";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { Post } from "@web-speed-hackathon-2026/server/src/models/Post";

const rawTemplate = readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");

const shellHtml = `<div style="display:flex;justify-content:center;font-family:sans-serif"><div style="display:flex;min-height:100vh;max-width:100%"><aside style="width:72px"></aside><main style="width:100%;max-width:640px;padding:16px;color:#042f2e">読込中...</main></div></div>`;

const htmlTemplate = rawTemplate.replace(
  '<div id="app"></div>',
  `<div id="app">${shellHtml}</div>`,
);

export const ssrRouter = Router();

ssrRouter.use("{*path}", async (req: Request, res: Response) => {
  try {
    const depth = req.originalUrl.split("/").filter(Boolean).length;
    if (depth === 0) {
      const posts = await Post.findAll({ limit: 10, offset: 0 });
      const postsJson = JSON.stringify(posts);
      const script = `<script>window.__INITIAL_POSTS__=${postsJson};</script>`;
      const html = htmlTemplate.replace('</head>', `${script}</head>`);
      return res.status(200).type("text/html").send(html);
    }
  } catch {
    // フォールバック
  }
  res.status(200).type("text/html").send(htmlTemplate);
});
