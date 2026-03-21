import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { Comment, Post, PostsImagesRelation } from "@web-speed-hackathon-2026/server/src/models";
import { getSequelize } from "@web-speed-hackathon-2026/server/src/sequelize";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : 24;
  const cursorParam = req.query["cursor"] as string | undefined;

  let cursorCondition = {};
  if (cursorParam) {
    try {
      const parsed = JSON.parse(Buffer.from(cursorParam, "base64url").toString());
      const { createdAt, id } = parsed;
      if (typeof createdAt !== "string" || typeof id !== "string") {
        throw new Error("Invalid cursor fields");
      }
      cursorCondition = {
        [Op.or]: [
          { createdAt: { [Op.lt]: createdAt } },
          { createdAt, id: { [Op.lt]: id } },
        ],
      };
    } catch {
      throw new httpErrors.BadRequest("Invalid cursor");
    }
  }

  const posts = await Post.findAll({
    where: cursorCondition,
    limit: limit + 1,
  });

  const hasMore = posts.length > limit;
  const resultPosts = hasMore ? posts.slice(0, limit) : posts;

  let nextCursor: string | null = null;
  if (hasMore && resultPosts.length > 0) {
    const last = resultPosts[resultPosts.length - 1]!;
    nextCursor = Buffer.from(
      JSON.stringify({ createdAt: last.createdAt, id: last.id }),
    ).toString("base64url");
  }

  return res.status(200).type("application/json").send({
    posts: resultPosts,
    hasMore,
    nextCursor,
  });
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
