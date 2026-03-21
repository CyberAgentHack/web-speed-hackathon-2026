import fs from "node:fs";
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

function loadSsgHtml(filename: string): string | null {
  const filePath = path.join(CLIENT_DIST_PATH, filename);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : null;
}

const ssgPages: Record<string, string | null> = {
  "/terms": loadSsgHtml("terms.html"),
  "/": loadSsgHtml("home.html"),
};

export const staticRouter = Router();

for (const [routePath, html] of Object.entries(ssgPages)) {
  if (html !== null) {
    staticRouter.get(routePath, (_req, res) => {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.send(html);
    });
  }
}

staticRouter.get("/posts/:postId", async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.postId, {
      attributes: [],
      include: [
        { association: "images", through: { attributes: [] }, attributes: ["id"] },
        {
          association: "user",
          attributes: ["profileImageId"],
          include: [{ association: "profileImage", attributes: ["id"] }],
        },
      ],
    });
    if (post !== null) {
      const linkValues: string[] = [];
      const images = post.get("images") as Array<{ id: string }> | undefined;
      if (images && images.length > 0) {
        linkValues.push(`</images/${images[0]!.id}.avif>; rel=preload; as=image`);
      }
      const user = post.get("user") as { profileImage?: { id: string } } | undefined;
      if (user?.profileImage) {
        linkValues.push(`</images/profiles/${user.profileImage.id}.avif>; rel=preload; as=image`);
      }
      if (linkValues.length > 0) {
        res.setHeader("Link", linkValues.join(", "));
      }
    }
  } catch {
    // preloadヘッダー付与に失敗してもページ表示は継続
  }
  next();
});

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    maxAge: 86400000,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (/\.(otf|woff2?|ttf|eot)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (/-[0-9a-f]{16,}\.(js|css)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);
