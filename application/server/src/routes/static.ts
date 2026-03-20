import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";
import { renderAppShell } from "@web-speed-hackathon-2026/server/src/ssr/render";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// history() が URL を /index.html に書き換えた後、SSRレンダリングしたHTMLを返す
staticRouter.use(async (req, res, next) => {
  if (req.url !== "/index.html") {
    return next();
  }

  try {
    // 元のリクエストURLを復元（history()が書き換える前のURL）
    const originalUrl = req.originalUrl?.split("?")[0] ?? "/";

    // 投稿データを取得（トップページの場合）
    let posts: unknown[] | undefined;
    if (originalUrl === "/" || originalUrl === "/index.html") {
      const postModels = await Post.findAll({ limit: 30, offset: 0 });
      posts = postModels.map((p) => p.toJSON());
    }

    // セッションからユーザーを取得（セッションミドルウェアを通す）
    let user: unknown | null = undefined;
    await new Promise<void>((resolve) => {
      sessionMiddleware(req as any, res as any, () => {
        resolve();
      });
    });
    const userId = (req as any).session?.userId;
    if (userId) {
      const userModel = await User.findByPk(userId);
      user = userModel ? userModel.toJSON() : null;
    } else {
      user = null;
    }

    const html = await renderAppShell(originalUrl, { posts, user });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    console.error("SSR render error:", e);
    next();
  }
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
  }),
);
