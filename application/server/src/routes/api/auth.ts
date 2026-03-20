import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";
import * as v from "valibot";

import { getDb } from "@web-speed-hackathon-2026/server/src/db";
import { findUserWithProfile } from "@web-speed-hackathon-2026/server/src/db/queries";
import { users } from "@web-speed-hackathon-2026/server/src/db/schema";
import { serializeUser } from "@web-speed-hackathon-2026/server/src/db/serializers";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { UserResponse } from "@web-speed-hackathon-2026/server/src/types/api";

const SignupBody = v.object({
  username: v.string(),
  name: v.string(),
  password: v.string(),
  description: v.optional(v.string()),
});

const SigninBody = v.object({
  username: v.string(),
  password: v.string(),
});

export const authRouter = new Hono<SessionEnv>()
  .post("/signup", async (c) => {
    const body = v.parse(SignupBody, await c.req.json());

    if (!/^[a-z0-9_-]+$/i.test(body.username)) {
      return c.json({ code: "INVALID_USERNAME" as const }, 400);
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      db.insert(users)
        .values({
          id,
          username: body.username,
          name: body.name,
          description: body.description ?? "",
          password: await Bun.password.hash(body.password, { algorithm: "bcrypt", cost: 8 }),
          createdAt: now,
          updatedAt: now,
        })
        .run();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
        return c.json({ code: "USERNAME_TAKEN" as const }, 400);
      }
      throw err;
    }

    const user = await findUserWithProfile(eq(users.id, id));
    c.var.session.set({ userId: id });
    return c.json<UserResponse>(serializeUser(user!) as unknown as UserResponse);
  })
  .post("/signin", async (c) => {
    const body = v.parse(SigninBody, await c.req.json());
    const db = getDb();

    const row = db.select().from(users).where(eq(users.username, body.username)).get();
    if (!row) {
      throw new HTTPException(400);
    }
    if (!(await Bun.password.verify(body.password, row.password))) {
      throw new HTTPException(400);
    }

    c.var.session.set({ userId: row.id });

    const user = await findUserWithProfile(eq(users.id, row.id));
    return c.json<UserResponse>(serializeUser(user!) as unknown as UserResponse);
  })
  .post("/signout", async (c) => {
    c.var.session.delete();
    return c.json({});
  });
