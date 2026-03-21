import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

export const authRouter = new Hono<AppEnv>();

authRouter.post("/signup", async (c) => {
  const body = await c.req.json();
  try {
    const { id: userId } = await User.create(body);
    const user = await User.findByPk(userId);
    c.get("session").userId = userId;
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

authRouter.post("/signin", async (c) => {
  const body = await c.req.json();
  const user = await User.findOne({
    where: { username: body.username },
  });

  if (user === null) {
    throw new HTTPException(400);
  }
  if (!user.validPassword(body.password)) {
    throw new HTTPException(400);
  }

  c.get("session").userId = user.id;
  return c.json(user, 200);
});

authRouter.post("/signout", async (c) => {
  c.get("session").userId = undefined;
  return c.json({}, 200);
});
