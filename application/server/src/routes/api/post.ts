import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post, ProfileImage, User } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

function parsePaginationParam(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
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
  const comments = await Comment.unscoped().findAll({
    attributes: ["id", "text", "createdAt"],
    include: [
      {
        as: "user",
        attributes: ["id", "name", "username"],
        include: [
          {
            as: "profileImage",
            attributes: ["id", "alt"],
            model: ProfileImage,
            required: true,
          },
        ],
        model: User.unscoped(),
        required: true,
      },
    ],
    limit: parsePaginationParam(req.query["limit"]),
    offset: parsePaginationParam(req.query["offset"]),
    order: [["createdAt", "ASC"]],
    where: {
      postId: req.params.postId,
    },
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
