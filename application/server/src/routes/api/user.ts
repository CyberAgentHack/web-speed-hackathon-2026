import { Router } from "express";
import httpErrors from "http-errors";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";

import { cache, TTL } from "../../cache";

export const userRouter = Router();

userRouter.get("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const cacheKey = `user:id:${req.session.userId}`;
  let user = cache.get<User>(cacheKey);
  if (user === undefined) {
    user = await User.findByPk(req.session.userId) ?? undefined;
    if (user === undefined) {
      throw new httpErrors.NotFound();
    }
    cache.set(cacheKey, user, TTL.USER);
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

  // Invalidate caches for this user
  cache.delete(`user:id:${req.session.userId}`);
  if (user.username) {
    cache.delete(`user:username:${user.username}`);
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username", async (req, res) => {
  const cacheKey = `user:username:${req.params.username}`;
  let user = cache.get<User>(cacheKey);
  if (user === undefined) {
    user = await User.findOne({ where: { username: req.params.username } }) ?? undefined;
    if (user === undefined) {
      throw new httpErrors.NotFound();
    }
    cache.set(cacheKey, user, TTL.USER);
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username/posts", async (req, res) => {
  const cacheKey = `user:username:${req.params.username}`;
  let user = cache.get<User>(cacheKey);
  if (user === undefined) {
    user = await User.findOne({ where: { username: req.params.username } }) ?? undefined;
    if (user === undefined) {
      throw new httpErrors.NotFound();
    }
    cache.set(cacheKey, user, TTL.USER);
  }

  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    where: {
      userId: user.id,
    },
  });

  return res.status(200).type("application/json").send(posts);
});
