import { Router } from "express";
import httpErrors from "http-errors";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { id: userId } = await User.create(req.body);
    const user = await User.findByPk(userId);

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
  console.log("[signin] body:", req.body);
  const user = await User.findOne({
    where: {
      username: req.body.username,
    },
  });

  console.log("[signin] user found:", user?.username ?? null);
  if (user === null) {
    console.log("[signin] user not found");
    throw new httpErrors.BadRequest();
  }
  const valid = user.validPassword(req.body.password);
  console.log("[signin] password valid:", valid);
  if (!valid) {
    throw new httpErrors.BadRequest();
  }

  req.session.userId = user.id;
  console.log("[signin] success");
  return res.status(200).type("application/json").send(user);
});

authRouter.post("/signout", async (req, res) => {
  req.session.userId = undefined;
  return res.status(200).type("application/json").send({});
});
