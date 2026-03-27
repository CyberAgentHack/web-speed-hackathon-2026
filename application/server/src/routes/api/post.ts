import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

// 投稿一覧（改善済み）
postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    include: [
      {
        association: "images",
        through: { attributes: [] },
      },
      { association: "movie" },
      { association: "sound" },
      // コメントもまとめて取得（なければ消してOK）
      {
        association: "comments",
        required: false,
      },
    ],
  });

  return res.status(200).type("application/json").send(posts);
});

// 投稿詳細（ついでに最適化）
postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId, {
    include: [
      {
        association: "images",
        through: { attributes: [] },
      },
      { association: "movie" },
      { association: "sound" },
      {
        association: "comments",
        required: false,
      },
    ],
  });

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

// コメント取得（そのままでOK）
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

// 投稿作成（そのままでOK）
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