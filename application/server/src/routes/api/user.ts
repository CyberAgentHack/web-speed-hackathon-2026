import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";

import { getDb } from "@web-speed-hackathon-2026/server/src/db";
import {
  findPostsDetail,
  findUserWithProfile,
} from "@web-speed-hackathon-2026/server/src/db/queries";
import { posts, users } from "@web-speed-hackathon-2026/server/src/db/schema";
import {
  serializePostDetail,
  serializeUser,
} from "@web-speed-hackathon-2026/server/src/db/serializers";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { PostResponse, UserResponse } from "@web-speed-hackathon-2026/server/src/types/api";
import { parsePagination } from "@web-speed-hackathon-2026/server/src/utils/parse_pagination";

const UpdateProfileBody = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  password: v.optional(v.string()),
  profileImageId: v.optional(v.string()),
});

export const userRouter = new Hono<SessionEnv>()
  .get("/me", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }
    const user = await findUserWithProfile(eq(users.id, userId));
    if (!user) {
      throw new HTTPException(404);
    }
    return c.json<UserResponse>(serializeUser(user) as unknown as UserResponse);
  })
  .put("/me", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }
    const existing = await findUserWithProfile(eq(users.id, userId));
    if (!existing) {
      throw new HTTPException(404);
    }

    const body = v.parse(UpdateProfileBody, await c.req.json());
    const db = getDb();
    const updates: Record<string, unknown> = {
      ...body,
      updatedAt: new Date().toISOString(),
    };
    if (updates["password"]) {
      updates["password"] = await Bun.password.hash(String(updates["password"]), {
        algorithm: "bcrypt",
        cost: 8,
      });
    }
    db.update(users).set(updates).where(eq(users.id, userId)).run();

    const updated = await findUserWithProfile(eq(users.id, userId));
    return c.json<UserResponse>(serializeUser(updated!) as unknown as UserResponse);
  })
  .get("/users/:username", async (c) => {
    const user = await findUserWithProfile(eq(users.username, c.req.param("username")));
    if (!user) {
      throw new HTTPException(404);
    }
    return c.json<UserResponse>(serializeUser(user) as unknown as UserResponse);
  })
  .get("/users/:username/posts", async (c) => {
    const user = await findUserWithProfile(eq(users.username, c.req.param("username")));
    if (!user) {
      throw new HTTPException(404);
    }

    const results = await findPostsDetail({
      where: eq(posts.userId, user.id),
      ...parsePagination(c.req.query()),
    });

    return c.json<PostResponse[]>(results.map(serializePostDetail) as unknown as PostResponse[]);
  });
