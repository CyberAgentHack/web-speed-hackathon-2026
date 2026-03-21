import { Router } from "express";
import httpErrors from "http-errors";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { getDb } from "@web-speed-hackathon-2026/server/src/db/client";
import * as schema from "@web-speed-hackathon-2026/server/src/db/schema";
import { findPostByPk, findPosts, findComments } from "@web-speed-hackathon-2026/server/src/db/queries";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const db = getDb();
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : 24;
  const cursorParam = req.query["cursor"] as string | undefined;

  let cursorCondition: any = undefined;
  if (cursorParam) {
    try {
      const parsed = JSON.parse(Buffer.from(cursorParam, "base64url").toString());
      const { createdAt, id } = parsed;
      if (typeof createdAt !== "string" || typeof id !== "string") {
        throw new Error("Invalid cursor fields");
      }
      cursorCondition = or(
        lt(schema.posts.createdAt, createdAt),
        and(eq(schema.posts.createdAt, createdAt), lt(schema.posts.id, id)),
      );
    } catch {
      throw new httpErrors.BadRequest("Invalid cursor");
    }
  }

  const posts = await findPosts(db, {
    where: cursorCondition,
    limit: limit + 1,
    orderBy: [desc(schema.posts.createdAt), desc(schema.posts.id)],
  });

  const hasMore = posts.length > limit;
  const resultPosts = hasMore ? posts.slice(0, limit) : posts;

  let nextCursor: string | null = null;
  if (hasMore && resultPosts.length > 0) {
    const last = resultPosts[resultPosts.length - 1]!;
    nextCursor = Buffer.from(
      JSON.stringify({ createdAt: last.createdAt, id: last.id }),
    ).toString("base64url");
  }

  return res.status(200).type("application/json").send({
    posts: resultPosts,
    hasMore,
    nextCursor,
  });
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await findPostByPk(getDb(), req.params.postId);

  if (!post) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const comments = await findComments(getDb(), req.params.postId, {
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
  });

  return res.status(200).type("application/json").send(comments);
});

postRouter.post("/posts", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const db = getDb();
  const { images, sound, movie, ...postData } = req.body;
  const now = new Date().toISOString();
  const postId = uuidv4();

  // Insert movie if provided
  let movieId: string | null = null;
  if (movie?.id) {
    movieId = movie.id;
    await db.insert(schema.movies).values({ id: movieId, createdAt: now, updatedAt: now });
  }

  // Insert post
  await db.insert(schema.posts).values({
    id: postId,
    text: postData.text,
    userId: req.session.userId,
    movieId,
    soundId: sound?.id ?? null,
    createdAt: now,
    updatedAt: now,
  });

  // Insert image relations
  if (images?.length) {
    await db.insert(schema.postsImagesRelations).values(
      images.map((img: { id: string }) => ({
        postId,
        imageId: img.id,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  const fullPost = await findPostByPk(db, postId);
  return res.status(200).type("application/json").send(fullPost);
});
