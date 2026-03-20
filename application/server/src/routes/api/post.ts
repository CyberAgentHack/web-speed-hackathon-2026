import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

export const postRouter = new Hono<SessionEnv>();

postRouter.get("/posts", async (c) => {
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const posts = await Post.scope("detail").findAll({
    limit: limit != null ? Number(limit) : undefined,
    offset: offset != null ? Number(offset) : undefined,
  });

  return c.json(posts);
});

postRouter.get("/posts/:postId", async (c) => {
  const post = await Post.scope("detail").findByPk(c.req.param("postId"));

  if (post === null) {
    throw new HTTPException(404);
  }

  return c.json(post);
});

postRouter.get("/posts/:postId/comments", async (c) => {
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const posts = await Comment.findAll({
    limit: limit != null ? Number(limit) : undefined,
    offset: offset != null ? Number(offset) : undefined,
    where: {
      postId: c.req.param("postId"),
    },
  });

  return c.json(posts);
});

postRouter.post("/posts", async (c) => {
  const userId = c.var.session.get()?.userId;
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  const body = await c.req.json();
  const post = await Post.create(
    {
      ...body,
      userId,
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

  return c.json(post);
});
