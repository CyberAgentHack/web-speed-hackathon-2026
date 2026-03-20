import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { UserResponse } from "@web-speed-hackathon-2026/server/src/types/api";

export const authRouter = new Hono<SessionEnv>()
  .post("/signup", async (c) => {
    try {
      const body = await c.req.json();
      const { id: userId } = await User.create(body);
      const user = await User.findByPk(userId);

      c.var.session.set({ userId });
      return c.json(user!.toJSON() as unknown as UserResponse);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        return c.json({ code: "USERNAME_TAKEN" as const }, 400);
      }
      if (err instanceof ValidationError) {
        return c.json({ code: "INVALID_USERNAME" as const }, 400);
      }
      throw err;
    }
  })
  .post("/signin", async (c) => {
    const body = await c.req.json();
    const user = await User.findOne({
      where: {
        username: body.username,
      },
    });

    if (user === null) {
      throw new HTTPException(400);
    }
    if (!user.validPassword(body.password)) {
      throw new HTTPException(400);
    }

    c.var.session.set({ userId: user.id });
    return c.json(user.toJSON() as unknown as UserResponse);
  })
  .post("/signout", async (c) => {
    c.var.session.delete();
    return c.json({});
  });
