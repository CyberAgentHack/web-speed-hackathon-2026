import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

const getPostsWithImages = async (
  option: Parameters<typeof Post.findAll>[0],
) => {
  const posts = await Post.findAll(option);
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const postForImages = await Post.findAll({
    where: {
      id: postIds,
    },
    attributes: ["id"],
    include: [
      {
        association: "images",
        through: { attributes: [] },
      },
    ],
    order: [["images", "createdAt", "ASC"]],
  });

  const imgMap = new Map<string, any[]>();
  postForImages.forEach((post) => {
    const plain = post.toJSON() as any;
    imgMap.set(plain.id, plain.images || []);
  });

  return posts.map((post) => {
    const plain = post.toJSON() as any;
    return {
      ...plain,
      images: imgMap.get(plain.id) || [],
    };
  });
};

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset:
      req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
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
    offset:
      req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
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
