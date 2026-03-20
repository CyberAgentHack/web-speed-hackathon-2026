import { Hono } from "hono";
import type { Context } from "hono";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = new Hono();

postRouter.get("/posts", async (c: Context) => {
  const limit = c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined;
  const offset = c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined;

  const posts = await Post.findAll({
    limit,
    offset,
  });

  return c.json(posts, 200);
});

postRouter.get("/posts/:postId", async (c: Context) => {
  const postId = c.req.param("postId");
  const post = await Post.findByPk(postId);

  if (post === null) {
    return c.json({ message: "Not Found" }, 404);
  }

  return c.json(post, 200);
});

postRouter.get("/posts/:postId/comments", async (c: Context) => {
  const postId = c.req.param("postId");
  const limit = c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined;
  const offset = c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined;

  const posts = await Comment.findAll({
    limit,
    offset,
    where: {
      postId,
    },
  });

  return c.json(posts, 200);
});

postRouter.post("/posts", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  if (session["userId"] === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const body = c.get("body" as never) || await c.req.json();

  const post = await Post.create(
    {
      ...body,
      userId: session["userId"],
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
