import { Router } from "express";
import httpErrors from "http-errors";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";

import { cache, TTL } from "../../cache";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { id: userId } = await User.create(req.body);
    const user = await User.findByPk(userId);

    if (user !== null) {
      cache.set(`user:id:${userId}`, user, TTL.USER);
    }

    req.session.userId = userId;
    return res.status(200).type("application/json").send(user);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(400).type("application/json").send({ code: "USERNAME_TAKEN" });
    }
    if (err instanceof ValidationError) {
      return res.status(400).type("application/json").send({ code: "INVALID_USERNAME" });
    }
    throw err;
  }
});

authRouter.post("/signin", async (req, res) => {
  // Fetch only id+password (unscoped to skip unnecessary profileImage JOIN)
  const userForAuth = await User.unscoped().findOne({
    attributes: ["id", "password"],
    where: { username: req.body.username },
  });

  if (userForAuth === null) {
    throw new httpErrors.BadRequest();
  }
  if (!(await userForAuth.validPassword(req.body.password))) {
    throw new httpErrors.BadRequest();
  }

  req.session.userId = userForAuth.id;
  const user = await User.findByPk(userForAuth.id);
  if (user !== null) {
    cache.set(`user:id:${userForAuth.id}`, user, TTL.USER);
  }
  return res.status(200).type("application/json").send(user);
});

authRouter.post("/signout", async (req, res) => {
  if (req.session.userId !== undefined) {
    cache.delete(`user:id:${req.session.userId}`);
  }
  req.session.userId = undefined;
  return res.status(200).type("application/json").send({});
});
