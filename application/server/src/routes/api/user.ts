import { Router } from "express";
import httpErrors from "http-errors";
import { eq } from "drizzle-orm";

import { getDb } from "@web-speed-hackathon-2026/server/src/db/client";
import * as schema from "@web-speed-hackathon-2026/server/src/db/schema";
import { findUserByPk, findUserByUsername, findPosts } from "@web-speed-hackathon-2026/server/src/db/queries";

export const userRouter = Router();

userRouter.get("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const user = await findUserByPk(getDb(), req.session.userId);

  if (!user) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.put("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const db = getDb();

  const existing = await findUserByPk(db, req.session.userId);
  if (!existing) {
    throw new httpErrors.NotFound();
  }

  const { name, description, profileImageId } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (name !== undefined) updates["name"] = name;
  if (description !== undefined) updates["description"] = description;
  if (profileImageId !== undefined) updates["profileImageId"] = profileImageId;

  await db.update(schema.users).set(updates).where(eq(schema.users.id, req.session.userId));

  const user = await findUserByPk(db, req.session.userId);
  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username", async (req, res) => {
  const user = await findUserByUsername(getDb(), req.params.username);

  if (!user) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username/posts", async (req, res) => {
  const db = getDb();
  const user = await findUserByUsername(db, req.params.username);

  if (!user) {
    throw new httpErrors.NotFound();
  }

  const posts = await findPosts(db, {
    where: eq(schema.posts.userId, user.id),
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
  });

  return res.status(200).type("application/json").send(posts);
});
