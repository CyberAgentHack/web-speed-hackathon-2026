import { Hono } from "hono";
import type { Context } from "hono";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";

export const userRouter = new Hono();

function parseLimit(value: string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.min(parsed, 100);
}

function parseOffset(value: string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

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

  const body = c.get("body" as never) || (await c.req.json());
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

  const limit = parseLimit(c.req.query("limit"));
  const offset = parseOffset(c.req.query("offset"));

  const posts = await Post.findAll({
    limit,
    offset,
    where: {
      userId: user.id,
    },
  });

  return c.json(posts, 200);
});
