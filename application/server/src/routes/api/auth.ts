import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

export const authRouter = new Hono<SessionEnv>();

authRouter.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { id: userId } = await User.create(body);
    const user = await User.findByPk(userId);

    c.var.session.set({ userId });
    return c.json(user);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return c.json({ code: "USERNAME_TAKEN" }, 400);
    }
    if (err instanceof ValidationError) {
      return c.json({ code: "INVALID_USERNAME" }, 400);
    }
    throw err;
  }
});

authRouter.post("/signin", async (c) => {
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
  return c.json(user);
});

authRouter.post("/signout", async (c) => {
  c.var.session.delete();
  return c.json({});
});
