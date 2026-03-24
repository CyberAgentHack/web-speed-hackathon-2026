import { Router } from "express";
import httpErrors from "http-errors";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";

export const userRouter = Router();

const userCache = new Map<string, { body: string; expireAt: number }>();
const userPostsCache = new Map<string, { body: string; expireAt: number }>();

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

  // ユーザーキャッシュをクリア（usernameはuserオブジェクトから取得）
  if (user.username) {
    userCache.delete(user.username);
    for (const key of userPostsCache.keys()) {
      if (key.startsWith(`${user.username}:`)) {
        userPostsCache.delete(key);
      }
    }
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username", async (req, res) => {
  const now = Date.now();
  const cached = userCache.get(req.params.username);
  if (cached != null && cached.expireAt > now) {
    return res.status(200).type("application/json").send(cached.body);
  }

  const user = await User.findOne({
    where: {
      username: req.params.username,
    },
  });

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  const body = JSON.stringify(user);
  userCache.set(req.params.username, { body, expireAt: now + 30000 });

  return res.status(200).type("application/json").send(body);
});

userRouter.get("/users/:username/posts", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  const cacheKey = `${req.params.username}:${limit}:${offset}`;
  const now = Date.now();

  const cached = userPostsCache.get(cacheKey);
  if (cached != null && cached.expireAt > now) {
    return res.status(200).type("application/json").send(cached.body);
  }

  // ユーザーを先に取得せず、1クエリでユーザーに紐づくポストを取得
  const posts = await Post.findAll({
    include: [
      {
        association: "user",
        attributes: { exclude: ["profileImageId"] },
        include: [{ association: "profileImage" }],
        required: true,
        where: { username: req.params.username },
      },
      {
        association: "images",
        through: { attributes: [] },
      },
      { association: "movie" },
      { association: "sound" },
    ],
    limit,
    offset,
  });

  if (posts.length === 0) {
    // ユーザーが存在するか確認
    const userExists = await User.findOne({ where: { username: req.params.username } });
    if (userExists === null) {
      throw new httpErrors.NotFound();
    }
  }

  const body = JSON.stringify(posts);
  userPostsCache.set(cacheKey, { body, expireAt: now + 10000 });

  return res.status(200).type("application/json").send(body);
});
