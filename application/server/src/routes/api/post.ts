import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import { getSession } from "@web-speed-hackathon-2026/server/src/session";
import { parseJSON } from "@web-speed-hackathon-2026/server/src/utils/parse_json";

export const postRouter = new Hono();

postRouter.get("/posts", async (c) => {
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const posts = await Post.findAll({
    limit: limit != null ? Number(limit) : undefined,
    offset: offset != null ? Number(offset) : undefined,
  });

  return c.json(posts);
});

postRouter.get("/posts/:postId", async (c) => {
  const post = await Post.findByPk(c.req.param("postId"));

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
  const userId = getSession(c);
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await parseJSON(c);
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
