import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

const DEFAULT_POST_LIMIT = 10;
const MAX_POST_LIMIT = 20;
const DEFAULT_COMMENT_LIMIT = 20;
const MAX_COMMENT_LIMIT = 50;

function parseLimit(value: unknown, defaultValue: number, maxValue: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return Math.min(parsed, maxValue);
}

function parseOffset(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: parseLimit(req.query["limit"], DEFAULT_POST_LIMIT, MAX_POST_LIMIT),
    offset: parseOffset(req.query["offset"]),
    order: [["createdAt", "DESC"]],
  });

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
  const comments = await Comment.findAll({
    limit: parseLimit(req.query["limit"], DEFAULT_COMMENT_LIMIT, MAX_COMMENT_LIMIT),
    offset: parseOffset(req.query["offset"]),
    where: {
      postId: req.params.postId,
    },
    order: [["createdAt", "ASC"]],
  });

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