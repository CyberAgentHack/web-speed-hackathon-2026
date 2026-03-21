import { Router } from "express";
import httpErrors from "http-errors";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";

export const userRouter = Router();

const DEFAULT_POST_LIMIT = 10;
const MAX_POST_LIMIT = 20;

function parseLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_POST_LIMIT;
  }
  return Math.min(parsed, MAX_POST_LIMIT);
}

function parseOffset(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
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

  const posts = await Post.findAll({
    limit: parseLimit(req.query["limit"]),
    offset: parseOffset(req.query["offset"]),
    where: {
      userId: user.id,
    },
  });

  return res.status(200).type("application/json").send(posts);
});