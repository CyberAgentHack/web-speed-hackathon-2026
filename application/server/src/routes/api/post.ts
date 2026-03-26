import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

// API レスポンスキャッシュ
const apiCache = new Map<string, string>();

export function clearPostCache() {
  apiCache.clear();
}

postRouter.get("/posts", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : 30;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : 0;
  const cacheKey = `posts:${limit}:${offset}`;

  const cached = apiCache.get(cacheKey);
  if (cached) {
    res.set("Cache-Control", "public, max-age=5");
    return res.status(200).type("application/json").send(cached);
  }

  const posts = await Post.findAll({ limit, offset: offset || undefined });
  const json = JSON.stringify(posts);
  apiCache.set(cacheKey, json);

  res.set("Cache-Control", "public, max-age=5");
  return res.status(200).type("application/json").send(json);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const cacheKey = `post:${req.params.postId}`;

  const cached = apiCache.get(cacheKey);
  if (cached) {
    res.set("Cache-Control", "public, max-age=5");
    return res.status(200).type("application/json").send(cached);
  }

  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  const json = JSON.stringify(post);
  apiCache.set(cacheKey, json);

  res.set("Cache-Control", "public, max-age=5");
  return res.status(200).type("application/json").send(json);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : 30;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : 0;
  const cacheKey = `comments:${req.params.postId}:${limit}:${offset}`;

  const cached = apiCache.get(cacheKey);
  if (cached) {
    res.set("Cache-Control", "public, max-age=5");
    return res.status(200).type("application/json").send(cached);
  }

  const posts = await Comment.findAll({
    limit,
    offset: offset || undefined,
    where: {
      postId: req.params.postId,
    },
  });
  const json = JSON.stringify(posts);
  apiCache.set(cacheKey, json);

  res.set("Cache-Control", "public, max-age=5");
  return res.status(200).type("application/json").send(json);
});

postRouter.post("/posts", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const post = await Post.create(
    {
      ...req.body,
      userId: req.session.userId,
    },
    {
      include: [
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
    },
  );

  // 新しい投稿が追加されたらキャッシュをクリア
  clearPostCache();

  return res.status(200).type("application/json").send(post);
});
