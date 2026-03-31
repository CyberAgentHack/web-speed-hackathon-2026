import type { Request } from "express";
import { Router } from "express";
import httpErrors from "http-errors";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";

export const authRouter = Router();

async function regenerateSession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error != null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function saveSession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => {
      if (error != null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function destroySession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => {
      if (error != null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

authRouter.post("/signup", async (req, res) => {
  try {
    const { id: userId } = await User.create(req.body);
    const user = await User.findByPk(userId);

    await regenerateSession(req);
    req.session.userId = userId;
    await saveSession(req);
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
  if (!user.validPassword(req.body.password)) {
    throw new httpErrors.BadRequest();
  }

  await regenerateSession(req);
  req.session.userId = user.id;
  await saveSession(req);
  return res.status(200).type("application/json").send(user);
});

authRouter.post("/signout", async (req, res) => {
  await destroySession(req);
  res.clearCookie("connect.sid");
  return res.status(200).type("application/json").send({});
});
