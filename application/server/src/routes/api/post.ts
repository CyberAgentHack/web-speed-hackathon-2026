import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import { cache, TTL } from "../../cache";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  const cacheKey = `posts:${limit ?? "all"}:${offset ?? 0}`;

  let posts = cache.get<Post[]>(cacheKey);
  if (posts === undefined) {
    posts = await Post.findAll({ limit, offset });
    cache.set(cacheKey, posts, TTL.POST);
  }

  return res.status(200).type("application/json").send(posts);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const cacheKey = `post:${req.params.postId}`;
  let post = cache.get<Post>(cacheKey);
  if (post === undefined) {
    post = await Post.findByPk(req.params.postId) ?? undefined;
    if (post !== undefined) {
      cache.set(cacheKey, post, TTL.POST);
    }
  }

  if (post === undefined) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  const cacheKey = `post:comments:${req.params.postId}:${limit ?? "all"}:${offset ?? 0}`;

  let comments = cache.get<Comment[]>(cacheKey);
  if (comments === undefined) {
    comments = await Comment.findAll({
      limit,
      offset,
      where: {
        postId: req.params.postId,
      },
    });
    cache.set(cacheKey, comments, TTL.POST);
  }

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

  // Invalidate timeline cache
  cache.deleteByPrefix("posts:");
  cache.deleteByPrefix("search:");
  cache.deleteByPrefix("user:posts:");

  return res.status(200).type("application/json").send(post);
});
