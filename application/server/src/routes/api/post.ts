import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { CommentResponse, PostResponse } from "@web-speed-hackathon-2026/server/src/types/api";

export const postRouter = new Hono<SessionEnv>()
  .get("/posts", async (c) => {
    const limit = c.req.query("limit");
    const offset = c.req.query("offset");

    const posts = await Post.scope("detail").findAll({
      ...(limit != null ? { limit: Number(limit) } : {}),
      ...(offset != null ? { offset: Number(offset) } : {}),
    });

    return c.json(posts.map((p) => p.toJSON()) as unknown as PostResponse[]);
  })
  .get("/posts/:postId", async (c) => {
    const post = await Post.scope("detail").findByPk(c.req.param("postId"));

    if (post === null) {
      throw new HTTPException(404);
    }

    return c.json(post.toJSON() as unknown as PostResponse);
  })
  .get("/posts/:postId/comments", async (c) => {
    const limit = c.req.query("limit");
    const offset = c.req.query("offset");

    const comments = await Comment.findAll({
      ...(limit != null ? { limit: Number(limit) } : {}),
      ...(offset != null ? { offset: Number(offset) } : {}),
      where: {
        postId: c.req.param("postId"),
      },
    });

    return c.json(comments.map((c) => c.toJSON()) as unknown as CommentResponse[]);
  })
  .post("/posts", async (c) => {
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

    return c.json(post.toJSON() as unknown as PostResponse);
  });
