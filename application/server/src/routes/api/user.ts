import { Router } from "express";
import httpErrors from "http-errors";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";

export const userRouter = Router();

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

function parsePagination(query: Record<string, unknown>): {
  limit: number;
  offset: number;
} {
  const limit = parseNumberQuery(query["limit"]);
  const offset = parseNumberQuery(query["offset"]);

  return {
    limit: Math.min(Math.max(limit ?? 20, 1), 50),
    offset: Math.max(offset ?? 0, 0),
  };
}

userRouter.get("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const user = await User.findByPk(req.session.userId);

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.put("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const user = await User.findByPk(req.session.userId);

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  Object.assign(user, req.body);
  await user.save();

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.params.username,
    },
  });

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username/posts", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.params.username,
    },
  });

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const posts = await Post.findAll({
    limit,
    offset,
    where: {
      userId: user.id,
    },
  });

  return res.status(200).type("application/json").send(posts.map(toPostListItem));
});
