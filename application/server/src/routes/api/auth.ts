import bcrypt from "bcrypt";
import { Router } from "express";
import httpErrors from "http-errors";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";

export const authRouter = Router();

const BCRYPT_ROUNDS = 8;

authRouter.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password as string, BCRYPT_ROUNDS);
    const { id: userId } = await User.create({ ...req.body, password: hashedPassword });
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
  const user = await User.findOne({
    where: {
      username: req.body.username,
    },
  });

  if (user === null) {
    throw new httpErrors.BadRequest();
  }
  if (!await user.validPassword(req.body.password)) {
    throw new httpErrors.BadRequest();
  }

  req.session.userId = user.id;
  return res.status(200).type("application/json").send(user);
});

authRouter.post("/signout", async (req, res) => {
  req.session.userId = undefined;
  return res.status(200).type("application/json").send({});
});
