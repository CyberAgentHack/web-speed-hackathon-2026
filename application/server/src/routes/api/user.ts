import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { PostResponse, UserResponse } from "@web-speed-hackathon-2026/server/src/types/api";

export const userRouter = new Hono<SessionEnv>()
  .get("/me", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }
    const user = await User.findByPk(userId);

    if (user === null) {
      throw new HTTPException(404);
    }

    return c.json(user.toJSON() as unknown as UserResponse);
  })
  .put("/me", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }
    const user = await User.findByPk(userId);

    if (user === null) {
      throw new HTTPException(404);
    }

    const body = await c.req.json();
    Object.assign(user, body);
    await user.save();

    return c.json(user.toJSON() as unknown as UserResponse);
  })
  .get("/users/:username", async (c) => {
    const user = await User.findOne({
      where: {
        username: c.req.param("username"),
      },
    });

    if (user === null) {
      throw new HTTPException(404);
    }

    return c.json(user.toJSON() as unknown as UserResponse);
  })
  .get("/users/:username/posts", async (c) => {
    const user = await User.findOne({
      where: {
        username: c.req.param("username"),
      },
    });

    if (user === null) {
      throw new HTTPException(404);
    }

    const limit = c.req.query("limit");
    const offset = c.req.query("offset");

    const posts = await Post.scope("detail").findAll({
      ...(limit != null ? { limit: Number(limit) } : {}),
      ...(offset != null ? { offset: Number(offset) } : {}),
      where: {
        userId: user.id,
      },
    });

    return c.json(posts.map((p) => p.toJSON()) as unknown as PostResponse[]);
  });
