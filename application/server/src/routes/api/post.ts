import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { Comment, Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { POST_FULL_SCOPE } from "@web-speed-hackathon-2026/server/src/models/Post";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    ...POST_FULL_SCOPE,
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
  });

  return res.status(200).type("application/json").send(posts);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId, POST_FULL_SCOPE);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  // Step 1: コメント取得（user情報なし）
  const comments = await Comment.unscoped().findAll({
    where: { postId: req.params.postId },
    order: [["createdAt", "ASC"]],
    limit,
    offset,
  });

  // Step 2: ユーザー情報バッチ取得
  const userIds = [...new Set(comments.map((c) => c.userId))];
  const users = userIds.length > 0
    ? await User.unscoped().findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ["id", "username", "name", "profileImageId"],
        include: [{ association: "profileImage" }],
      })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.toJSON()]));

  // Step 3: マージ（default scopeと同じ形式: userId/postIdを除外、userを付与）
  const result = comments.map((c) => {
    const { userId, postId, ...rest } = c.toJSON() as Record<string, unknown>;
    return { ...rest, user: userMap[c.userId] };
  });

  return res.status(200).type("application/json").send(result);
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
