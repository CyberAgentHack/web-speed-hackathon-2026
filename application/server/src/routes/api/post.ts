import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post, PostsImagesRelation } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : 30,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : 0,
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
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : 30,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : 0,
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

  const body = req.body as {
    text: string;
    images?: { id: string }[];
    movie?: { id: string };
    sound?: { id: string };
  };

  const post = await Post.create({
    text: body.text,
    userId: req.session.userId,
    movieId: body.movie?.id,
    soundId: body.sound?.id,
  });

  if (body.images && body.images.length > 0) {
    await PostsImagesRelation.bulkCreate(
      body.images.map((img) => ({ postId: post.id, imageId: img.id })),
    );
  }

  const freshPost = await Post.findByPk(post.id);
  return res.status(200).type("application/json").send(freshPost);
});
