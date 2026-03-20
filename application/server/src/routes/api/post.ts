import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post, PostsImagesRelation } from "@web-speed-hackathon-2026/server/src/models";
import { getSequelize } from "@web-speed-hackathon-2026/server/src/sequelize";

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

  const { images, sound, ...postData } = req.body;

  const post = await getSequelize().transaction(async (transaction) => {
    const created = await Post.create(
      {
        ...postData,
        soundId: sound?.id,
        userId: req.session.userId,
      },
      {
        include: [
          { association: "movie" },
        ],
        transaction,
      },
    );

    if (images?.length) {
      await PostsImagesRelation.bulkCreate(
        images.map((img: { id: string }) => ({ postId: created.id, imageId: img.id })),
        { transaction },
      );
    }

    return created;
  });

  const fullPost = await Post.findByPk(post.id);
  return res.status(200).type("application/json").send(fullPost);
});
