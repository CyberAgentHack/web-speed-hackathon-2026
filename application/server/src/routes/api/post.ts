import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

function toPostListItem(post: Post) {
  const json = post.toJSON() as unknown as {
    createdAt: string;
    id: string;
    images?: Array<{ alt: string; id: string }>;
    movie?: { id: string } | null;
    sound?: { artist: string; id: string; title: string } | null;
    text: string;
    user: {
      id: string;
      name: string;
      profileImage: { alt: string; id: string };
      username: string;
    };
  };

  return {
    createdAt: json.createdAt,
    id: json.id,
    images: json.images?.map((image) => ({ alt: image.alt, id: image.id })) ?? [],
    movie: json.movie != null ? { id: json.movie.id } : null,
    sound:
      json.sound != null
        ? { artist: json.sound.artist, id: json.sound.id, title: json.sound.title }
        : null,
    text: json.text,
    user: {
      id: json.user.id,
      name: json.user.name,
      profileImage: { alt: json.user.profileImage.alt, id: json.user.profileImage.id },
      username: json.user.username,
    },
  };
}

function parseNumberQuery(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePagination(req: { query: Record<string, unknown> }): {
  limit: number;
  offset: number;
} {
  const limit = parseNumberQuery(req.query["limit"]);
  const offset = parseNumberQuery(req.query["offset"]);

  return {
    limit: Math.min(Math.max(limit ?? 20, 1), 50),
    offset: Math.max(offset ?? 0, 0),
  };
}

postRouter.get("/posts", async (req, res) => {
  const { limit, offset } = parsePagination(req as unknown as { query: Record<string, unknown> });

  const posts = await Post.findAll({
    limit,
    offset,
  });

  return res.status(200).type("application/json").send(posts.map(toPostListItem));
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const { limit, offset } = parsePagination(req as unknown as { query: Record<string, unknown> });

  const posts = await Comment.findAll({
    limit,
    offset,
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
