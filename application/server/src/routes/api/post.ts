import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import {
  createCommentPayloadQuery,
  createPostPayloadQuery,
} from "@web-speed-hackathon-2026/server/src/routes/api/post_payloads";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.unscoped().findAll(
    createPostPayloadQuery({
      limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
      offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    }),
  );

  return res.status(200).type("application/json").send(posts);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.unscoped().findOne(
    createPostPayloadQuery({
      where: {
        id: req.params.postId,
      },
    }),
  );

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const posts = await Comment.unscoped().findAll(
    createCommentPayloadQuery({
      limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
      offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
      where: {
        postId: req.params.postId,
      },
    }),
  );

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

  return res.status(200).type("application/json").send(post);
});
