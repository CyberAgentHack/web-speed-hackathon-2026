import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";
import {
  setSession,
  clearSession,
} from "@web-speed-hackathon-2026/server/src/session";
import { parseJSON } from "@web-speed-hackathon-2026/server/src/utils/parse_json";

export const authRouter = new Hono();

authRouter.post("/signup", async (c) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await parseJSON(c);
    const { id: userId } = await User.create(body);
    const user = await User.findByPk(userId);

    setSession(c, userId);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await parseJSON(c);
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

  setSession(c, user.id);
  return c.json(user);
});

authRouter.post("/signout", async (c) => {
  clearSession(c);
  return c.json({});
});
