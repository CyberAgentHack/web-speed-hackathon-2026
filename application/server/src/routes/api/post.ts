import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

postRouter.post("/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  // Simple mock translation for the hackathon to avoid heavy LLM
  // In a real scenario, this would call an external API or a local model.
  const translatedText = targetLanguage === "en" ? `[Translated to English]: ${text}` : text;

  return res.status(200).json({ translatedText });
});

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    order: [["createdAt", "DESC"]], // タイムラインなので降順
    attributes: { exclude: ["updatedAt"] },
    include: [
      {
        association: "user",
        attributes: { exclude: ["password", "updatedAt"] },
        include: [
          {
            association: "profileImage",
            attributes: { exclude: ["updatedAt"] },
          },
        ],
      },
      {
        association: "images",
        attributes: { exclude: ["updatedAt"] },
        through: { attributes: [] },
      },
      {
        association: "movie",
        attributes: { exclude: ["updatedAt"] },
      },
      {
        association: "sound",
        attributes: { exclude: ["updatedAt"] },
      },
    ],
  });

  return res.status(200).type("application/json").send(posts);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId, {
    attributes: { exclude: ["updatedAt"] },
    include: [
      {
        association: "user",
        attributes: { exclude: ["password", "updatedAt"] },
        include: [
          {
            association: "profileImage",
            attributes: { exclude: ["updatedAt"] },
          },
        ],
      },
      {
        association: "images",
        attributes: { exclude: ["updatedAt"] },
        through: { attributes: [] },
      },
      {
        association: "movie",
        attributes: { exclude: ["updatedAt"] },
      },
      {
        association: "sound",
        attributes: { exclude: ["updatedAt"] },
      },
    ],
  });

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
    attributes: { exclude: ["updatedAt"] },
    include: [
      {
        association: "user",
        attributes: { exclude: ["password", "updatedAt"] },
        include: [
          {
            association: "profileImage",
            attributes: { exclude: ["updatedAt"] },
          },
        ],
      },
    ],
  });

  return res.status(200).type("application/json").send(posts);
});

postRouter.post("/posts", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const { text, images, movie, sound } = req.body as {
    text: string;
    images?: { id: string }[];
    movie?: { id: string };
    sound?: { id: string };
  };

  // Create the post base with optional belongsTo associations (movie/sound)
  const post = await Post.create({
    text,
    userId: req.session.userId,
    movieId: movie?.id,
    soundId: sound?.id,
  });

  // Handle many-to-many association for images
  if (images && Array.isArray(images) && images.length > 0) {
    // @ts-ignore: setImages is dynamic
    await (post as any).setImages(images.map((img) => img.id));
  }

  // Reload the post with the default scope to include all associations for the response
  const createdPost = await Post.findByPk(post.id);

  if (!createdPost) {
    throw new httpErrors.InternalServerError("Failed to retrieve created post");
  }

  return res.status(200).type("application/json").send(createdPost);
});
