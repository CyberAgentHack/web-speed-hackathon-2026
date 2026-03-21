import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

export const userRouter = new Hono<AppEnv>();

userRouter.get("/me", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }
  const user = await User.findByPk(c.get("session").userId);

  if (user === null) {
    throw new HTTPException(404);
  }

  return c.json(user, 200);
});

userRouter.put("/me", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }
  const user = await User.findByPk(c.get("session").userId);

  if (user === null) {
    throw new HTTPException(404);
  }

  const body = await c.req.json();
  Object.assign(user, body);
  await user.save();

  return c.json(user, 200);
});

userRouter.get("/users/:username", async (c) => {
  const user = await User.findOne({
    where: { username: c.req.param("username") },
  });

  if (user === null) {
    throw new HTTPException(404);
  }

  return c.json(user, 200);
});

userRouter.get("/users/:username/posts", async (c) => {
  const user = await User.unscoped().findOne({
    attributes: ["id"],
    where: { username: c.req.param("username") },
  });

  if (user === null) {
    throw new HTTPException(404);
  }

  const posts = await Post.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
    where: { userId: user.id },
  });

  return c.json(posts, 200);
});
