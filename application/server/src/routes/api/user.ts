import { Hono } from "hono";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";
import {
  notFound,
  unauthorized,
} from "@web-speed-hackathon-2026/server/src/utils/http_error";
import { readJsonBody } from "@web-speed-hackathon-2026/server/src/utils/request_body";

export const userRouter = new Hono<Env>();

userRouter.get("/me", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }
  const user = await User.findByPk(c.get("session").userId);

  if (user === null) {
    notFound();
  }

  return c.json(user);
});

userRouter.put("/me", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }
  const user = await User.findByPk(c.get("session").userId);

  if (user === null) {
    notFound();
  }

  const body = await readJsonBody<Record<string, unknown>>(c.req.raw);
  Object.assign(user, body);
  await user.save();

  return c.json(user);
});

userRouter.get("/users/:username", async (c) => {
  const user = await User.findOne({
    where: {
      username: c.req.param("username"),
    },
  });

  if (user === null) {
    notFound();
  }

  return c.json(user);
});

userRouter.get("/users/:username/posts", async (c) => {
  const user = await User.findOne({
    where: {
      username: c.req.param("username"),
    },
  });

  if (user === null) {
    notFound();
  }

  const posts = await Post.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
    where: {
      userId: user.id,
    },
  });

  return c.json(posts);
});
