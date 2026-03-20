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
  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const posts = await Comment.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    where: {
      postId: req.params.postId,
    },
  });

  return res.status(200).type("application/json").send(posts);
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

  return res.status(200).type("application/json").send(post);
});
