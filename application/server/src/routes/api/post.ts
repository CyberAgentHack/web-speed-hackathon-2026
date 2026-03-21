import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

export const postRouter = new Hono<AppEnv>();

postRouter.get("/posts", async (c) => {
  const posts = await Post.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
  });

  return c.json(posts, 200);
});

postRouter.get("/posts/:postId", async (c) => {
  const post = await Post.findByPk(c.req.param("postId"));

  if (post === null) {
    throw new HTTPException(404);
  }

  return c.json(post, 200);
});

postRouter.get("/posts/:postId/comments", async (c) => {
  const posts = await Comment.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
    where: {
      postId: c.req.param("postId"),
    },
  });

  return c.json(posts, 200);
});

postRouter.post("/posts", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  const body = await c.req.json();
  const post = await Post.create(
    {
      ...body,
      userId: c.get("session").userId,
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

  return c.json(post, 200);
});
