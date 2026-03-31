import { v4 as uuidv4 } from "uuid";
import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Image, Post, PostsImagesRelation } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

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

  const text = typeof req.body.text === "string" ? req.body.text : undefined;
  if (text === undefined) {
    throw new httpErrors.BadRequest("Invalid post text");
  }

  const images: Array<{ id: string }> = Array.isArray(req.body.images)
    ? req.body.images.filter(
        (image: unknown): image is { id: string } =>
          typeof image === "object" &&
          image !== null &&
          "id" in image &&
          typeof image.id === "string",
      )
    : [];

  const movieId =
    typeof req.body.movie === "object" &&
    req.body.movie !== null &&
    "id" in req.body.movie &&
    typeof req.body.movie.id === "string"
      ? req.body.movie.id
      : undefined;
  const soundId =
    typeof req.body.sound === "object" &&
    req.body.sound !== null &&
    "id" in req.body.sound &&
    typeof req.body.sound.id === "string"
      ? req.body.sound.id
      : undefined;

  const post = await Post.create({
    id: uuidv4(),
    movieId,
    soundId,
    text,
    userId: req.session.userId,
  });

  if (images.length > 0) {
    const existingImages = await Image.findAll({
      where: {
        id: images.map((image) => image.id),
      },
    });
    if (existingImages.length !== images.length) {
      throw new httpErrors.BadRequest("Invalid image ids");
    }
    await PostsImagesRelation.bulkCreate(
      images.map((image) => ({
        imageId: image.id,
        postId: post.id,
      })),
    );
  }

  const createdPost = await Post.findByPk(post.id);
  return res.status(200).type("application/json").send(createdPost);
});
