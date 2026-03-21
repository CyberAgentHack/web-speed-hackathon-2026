import { randomUUID } from "node:crypto";

import { Router } from "express";
import httpErrors from "http-errors";

import {
  Comment,
  Image,
  Movie,
  Post,
  PostsImagesRelation,
  Sound,
} from "@web-speed-hackathon-2026/server/src/models";

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
  const userId = req.session.userId;

  const postId = await Post.sequelize!.transaction(async (transaction) => {
    const images: Array<{ alt: string; id: string }> = Array.isArray(req.body.images)
      ? req.body.images
      : [];
    const movie = req.body.movie;
    const sound = req.body.sound;

    if (images.length > 0) {
      await Image.bulkCreate(images, { transaction });
    }
    if (movie != null) {
      await Movie.create(movie, { transaction });
    }
    if (sound != null) {
      await Sound.create(sound, { transaction });
    }

    const post = await Post.create(
      {
        id: randomUUID(),
        movieId: movie?.id,
        soundId: sound?.id,
        text: req.body.text,
        userId,
      },
      { transaction },
    );

    if (images.length > 0) {
      await PostsImagesRelation.bulkCreate(
        images.map((image) => ({ imageId: image.id, postId: post.id })),
        { transaction },
      );
    }

    return post.id;
  });

  const post = await Post.findByPk(postId);

  if (post == null) {
    throw new httpErrors.InternalServerError();
  }

  return res.status(200).type("application/json").send(post);
});
