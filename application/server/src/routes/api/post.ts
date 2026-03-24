import { randomUUID } from "node:crypto";

import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import {
  Comment,
  Image,
  Movie,
  Post,
  PostsImagesRelation,
  Sound,
} from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

interface PostRequestBody {
  images?: Array<{ id?: string }>;
  movie?: { id?: string };
  sound?: { id?: string };
  text?: string;
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
  const userId = req.session.userId as string;

  const { images = [], movie, sound, text } = req.body as PostRequestBody;
  const imageIds = images
    .map((image) => image.id)
    .filter((imageId): imageId is string => typeof imageId === "string");
  const movieId = typeof movie?.id === "string" ? movie.id : undefined;
  const soundId = typeof sound?.id === "string" ? sound.id : undefined;

  if (typeof text !== "string" || text.length === 0) {
    throw new httpErrors.BadRequest();
  }

  const post = await Post.sequelize!.transaction(async (transaction) => {
    if (movieId !== undefined) {
      const existingMovie = await Movie.findByPk(movieId, { transaction });
      if (existingMovie === null) {
        throw new httpErrors.BadRequest();
      }
    }

    if (soundId !== undefined) {
      const existingSound = await Sound.findByPk(soundId, { transaction });
      if (existingSound === null) {
        throw new httpErrors.BadRequest();
      }
    }

    const existingImages =
      imageIds.length === 0
        ? []
        : await Image.findAll({
            transaction,
            where: {
              id: {
                [Op.in]: imageIds,
              },
            },
          });

    if (existingImages.length !== imageIds.length) {
      throw new httpErrors.BadRequest();
    }

    const createdPost = await Post.create(
        {
          id: randomUUID(),
          text,
          userId,
          ...(movieId === undefined ? {} : { movieId }),
          ...(soundId === undefined ? {} : { soundId }),
        },
      { transaction },
    );

    if (existingImages.length > 0) {
      await PostsImagesRelation.bulkCreate(
        existingImages.map((image) => ({
          imageId: image.id,
          postId: createdPost.id,
        })),
        { transaction },
      );
    }

    return Post.findByPk(createdPost.id, { transaction });
  });

  if (post === null) {
    throw new httpErrors.InternalServerError();
  }

  return res.status(200).type("application/json").send(post);
});
