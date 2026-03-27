import { Hono } from "hono";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";
import { badRequest } from "@web-speed-hackathon-2026/server/src/utils/http_error";
import { readJsonBody } from "@web-speed-hackathon-2026/server/src/utils/request_body";

export const authRouter = new Hono<Env>();

authRouter.post("/signup", async (c) => {
  try {
    const body = await readJsonBody<Record<string, unknown>>(c.req.raw);
    const { id: userId } = await User.create(body as any);
    const user = await User.findByPk(userId);

    c.get("session").userId = userId;
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
  const body = await readJsonBody<{ password?: string; username?: string }>(c.req.raw);
  if (typeof body.username !== "string" || typeof body.password !== "string") {
    badRequest();
  }

  const user = await User.findOne({
    where: {
      username: body.username,
    },
  });

  if (user === null) {
    badRequest();
  }
  if (!user.validPassword(body.password)) {
    badRequest();
  }

  c.get("session").userId = user.id;
  return c.json(user);
});

authRouter.post("/signout", async (c) => {
  c.get("session").userId = undefined;
  return c.json({});
});
