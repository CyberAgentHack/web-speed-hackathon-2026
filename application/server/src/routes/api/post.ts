import { Hono } from "hono";
import type { CreationAttributes } from "sequelize";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";
import { notFound, unauthorized } from "@web-speed-hackathon-2026/server/src/utils/http_error";
import { readJsonBody } from "@web-speed-hackathon-2026/server/src/utils/request_body";

export const postRouter = new Hono<Env>();

type AssetRef = { id: string };
type CreatePostRequest = {
  images?: AssetRef[];
  movie?: AssetRef;
  sound?: AssetRef;
  text: string;
};

postRouter.get("/posts", async (c) => {
  const posts = await Post.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
  });

  return c.json(posts);
});

postRouter.get("/posts/:postId", async (c) => {
  const post = await Post.findByPk(c.req.param("postId"));

  if (post === null) {
    notFound();
  }

  return c.json(post);
});

postRouter.get("/posts/:postId/comments", async (c) => {
  const posts = await Comment.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
    where: {
      postId: c.req.param("postId"),
    },
  });

  return c.json(posts);
});

postRouter.post("/posts", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  const userId = c.get("session").userId!;
  const body = await readJsonBody<CreatePostRequest>(c.req.raw);
  const postInput: CreationAttributes<Post> & Pick<CreatePostRequest, "images" | "movie" | "sound"> = {
    text: body.text,
    userId,
    movieId: body.movie?.id,
    soundId: body.sound?.id,
    images: body.images,
    movie: body.movie,
    sound: body.sound,
  };

  const post = await Post.create(
    postInput,
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
