import { randomUUID } from "node:crypto";

import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post, PostsImagesRelation } from "@web-speed-hackathon-2026/server/src/models";
import {
  augmentPostResponse,
  augmentPostsResponse,
} from "@web-speed-hackathon-2026/server/src/utils/augment_post_response";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
  });

  return res.status(200).type("application/json").send(await augmentPostsResponse(posts));
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(await augmentPostResponse(post));
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

  const images = Array.isArray(req.body?.images) ? req.body.images : [];

  const post = await Post.create({
    id: randomUUID(),
    movieId: req.body?.movie?.id,
    soundId: req.body?.sound?.id,
    text: req.body?.text,
    userId: req.session.userId,
  });

  if (images.length > 0) {
    await PostsImagesRelation.bulkCreate(
      images.map((image: { id: string }) => ({
        imageId: image.id,
        postId: post.id,
      })),
    );
  }

  const createdPost = await Post.findByPk(post.id);
  if (createdPost === null) {
    throw new httpErrors.InternalServerError();
  }

  return res.status(200).type("application/json").send(await augmentPostResponse(createdPost));
});
