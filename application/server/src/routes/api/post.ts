import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";
import * as v from "valibot";

import { getDb, getSqlite } from "@web-speed-hackathon-2026/server/src/db";
import {
  findComments,
  findPostDetail,
  findPostsDetail,
} from "@web-speed-hackathon-2026/server/src/db/queries";
import { posts, postsImagesRelations } from "@web-speed-hackathon-2026/server/src/db/schema";
import {
  serializeComment,
  serializePostDetail,
} from "@web-speed-hackathon-2026/server/src/db/serializers";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { CommentResponse, PostResponse } from "@web-speed-hackathon-2026/server/src/types/api";
import { parsePagination } from "@web-speed-hackathon-2026/server/src/utils/parse_pagination";

const CreatePostBody = v.object({
  text: v.string(),
  images: v.optional(v.array(v.object({ id: v.string() }))),
  movie: v.optional(v.object({ id: v.string() })),
  sound: v.optional(v.object({ id: v.string() })),
});

export const postRouter = new Hono<SessionEnv>()
  .get("/posts", async (c) => {
    const pagination = parsePagination(c.req.query());
    const results = await findPostsDetail(pagination);
    return c.json<PostResponse[]>(results.map(serializePostDetail) as unknown as PostResponse[]);
  })
  .get("/posts/:postId", async (c) => {
    const post = await findPostDetail(c.req.param("postId"));
    if (!post) {
      throw new HTTPException(404);
    }
    return c.json<PostResponse>(serializePostDetail(post) as unknown as PostResponse);
  })
  .get("/posts/:postId/comments", async (c) => {
    const pagination = parsePagination(c.req.query());
    const results = await findComments(c.req.param("postId"), pagination);
    return c.json<CommentResponse[]>(results.map(serializeComment) as unknown as CommentResponse[]);
  })
  .post("/posts", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    const body = v.parse(CreatePostBody, await c.req.json());
    const db = getDb();
    const sqlite = getSqlite();
    const postId = uuidv4();
    const now = new Date().toISOString();

    const createPost = sqlite.transaction(() => {
      db.insert(posts)
        .values({
          id: postId,
          text: body.text,
          userId,
          movieId: body.movie?.id ?? null,
          soundId: body.sound?.id ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      for (const img of body.images ?? []) {
        db.insert(postsImagesRelations)
          .values({
            postId,
            imageId: img.id,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    });
    createPost();

    const post = await findPostDetail(postId);
    return c.json<PostResponse>(serializePostDetail(post!) as unknown as PostResponse);
  });
