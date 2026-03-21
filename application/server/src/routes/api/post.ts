import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import { primeMovieThumbnail, primeResizedImage } from "@web-speed-hackathon-2026/server/src/routes/static";

export const postRouter = Router();

interface PrimeablePost {
  images?: Array<{ id: string }>;
  movie?: { id: string } | null;
  user?: { profileImage?: { id: string } | null } | null;
}

function primePostMedia(post: PrimeablePost | null | undefined): void {
  if (post == null) {
    return;
  }

  const profileImageId = post.user?.profileImage?.id;
  if (typeof profileImageId === "string") {
    primeResizedImage(`/images/profiles/${profileImageId}.jpg`, 96);
  }

  if (Array.isArray(post.images)) {
    for (const image of post.images.slice(0, 1)) {
      primeResizedImage(`/images/${image.id}.jpg`, 640);
    }
  }

  if (post.movie?.id != null) {
    primeMovieThumbnail(`/movies/${post.movie.id}.gif`);
  }
}

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
  });

  for (const post of posts.slice(0, 3)) {
    primePostMedia(post as unknown as PrimeablePost);
  }

  return res.status(200).type("application/json").send(posts);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  primePostMedia(post as unknown as PrimeablePost);

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
