import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post, User } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

// 投稿一覧（N+1解消）
postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : 20,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : 0,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        attributes: ["id", "name", "iconUrl"],
      },
      {
        association: "images",
      },
      {
        association: "comments",
        limit: 5, // コメント取りすぎ防止
        order: [["createdAt", "DESC"]],
      },
    ],
  });

  return res.status(200).json(posts);
});

// 投稿詳細
postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId, {
    include: [
      {
        model: User,
        attributes: ["id", "name", "iconUrl"],
      },
      {
        association: "images",
      },
      {
        association: "comments",
        include: [
          {
            model: User,
            attributes: ["id", "name", "iconUrl"],
          },
        ],
      },
    ],
  });

  if (!post) throw new httpErrors.NotFound();

  return res.status(200).json(post);
});

// コメント取得（軽量化）
postRouter.get("/posts/:postId/comments", async (req, res) => {
  const comments = await Comment.findAll({
    limit: Number(req.query["limit"] ?? 20),
    offset: Number(req.query["offset"] ?? 0),
    order: [["createdAt", "DESC"]],
    where: {
      postId: req.params.postId,
    },
    include: [
      {
        model: User,
        attributes: ["id", "name", "iconUrl"],
      },
    ],
  });

  return res.status(200).json(comments);
});
