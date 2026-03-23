import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

// 簡易的なインメモリキャッシュ
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5000; // 5秒間キャッシュ

function getCached(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

postRouter.get("/posts", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  
  const cacheKey = `posts:${limit}:${offset}`;
  const cachedData = getCached(cacheKey);
  if (cachedData) return res.status(200).type("application/json").send(cachedData);

  const posts = await Post.findAll({ limit, offset });
  setCache(cacheKey, posts);

  return res.status(200).type("application/json").send(posts);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const cacheKey = `post:${req.params.postId}`;
  const cachedData = getCached(cacheKey);
  if (cachedData) return res.status(200).type("application/json").send(cachedData);

  const post = await Post.findByPk(req.params.postId);
  if (post === null) {
    throw new httpErrors.NotFound();
  }
  setCache(cacheKey, post);

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  const { postId } = req.params;

  const cacheKey = `comments:${postId}:${limit}:${offset}`;
  const cachedData = getCached(cacheKey);
  if (cachedData) return res.status(200).type("application/json").send(cachedData);

  const comments = await Comment.findAll({
    limit,
    offset,
    where: { postId },
  });
  setCache(cacheKey, comments);

  return res.status(200).type("application/json").send(comments);
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

  return res.status(200).type("application/json").send(post);
});
