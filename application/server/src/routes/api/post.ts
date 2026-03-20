import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post, PostsImagesRelation } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    subQuery: false,
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

  const { images: imageIds, ...rest } = req.body;

  const post = await Post.create(
    {
      ...rest,
      userId: req.session.userId,
    },
    {
      include: [{ association: "movie" }, { association: "sound" }],
    },
  );

  if (Array.isArray(imageIds) && imageIds.length > 0) {
    await PostsImagesRelation.bulkCreate(
      imageIds.map((img: { id: string }) => ({ postId: post.id, imageId: img.id })),
    );
  }

  const result = await Post.findByPk(post.id);

  return res.status(200).type("application/json").send(result);
});
