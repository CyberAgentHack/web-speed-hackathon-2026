import { Hono } from "hono";
import type { Context } from "hono";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";

export const authRouter = new Hono();

authRouter.post("/signup", async (c: Context) => {
  try {
    const body = c.get("body" as never) || (await c.req.json());
    const { id: userId } = await User.create(body);
    const user = await User.findByPk(userId);

    const session = c.get("session" as never) as Record<string, unknown>;
    session["userId"] = userId;
    c.set("session" as never, session as never);

    return c.json(user, 200);
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

authRouter.post("/signin", async (c: Context) => {
  const body = c.get("body" as never) || (await c.req.json());
  const user = await User.findOne({
    where: {
      username: body.username,
    },
  });

  if (user === null) {
    return c.json({ message: "Bad Request" }, 400);
  }
  if (!user.validPassword(body.password)) {
    return c.json({ message: "Bad Request" }, 400);
  }

  const session = c.get("session" as never) as Record<string, unknown>;
  session["userId"] = user.id;
  c.set("session" as never, session as never);

  return c.json(user, 200);
});

authRouter.post("/signout", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  session["userId"] = undefined;
  c.set("session" as never, session as never);
  return c.json({}, 200);
});
