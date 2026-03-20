import { Hono } from "hono";
import type { Context } from "hono";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";

export const userRouter = new Hono();

userRouter.get("/me", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  if (session["userId"] === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const user = await User.findByPk(session["userId"] as string);

  if (user === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  return c.json(user, 200);
});

userRouter.put("/me", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  if (session["userId"] === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const user = await User.findByPk(session["userId"] as string);

  if (user === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  const body = c.get("body" as never) || await c.req.json();
  Object.assign(user, body);
  await user.save();

  return c.json(user, 200);
});

userRouter.get("/users/:username", async (c: Context) => {
  const username = c.req.param("username");
  const user = await User.findOne({
    where: {
      username,
    },
  });

  if (user === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  return c.json(user, 200);
});

userRouter.get("/users/:username/posts", async (c: Context) => {
  const username = c.req.param("username");
  const user = await User.findOne({
    where: {
      username,
    },
  });

  if (user === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  const limit = c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined;
  const offset = c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined;

  const posts = await Post.findAll({
    limit,
    offset,
    where: {
      userId: user.id,
    },
  });

  return c.json(posts, 200);
});
