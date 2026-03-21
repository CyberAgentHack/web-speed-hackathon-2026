import bcrypt from "bcrypt";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { LibsqlError } from "@libsql/client";

import { getDb } from "@web-speed-hackathon-2026/server/src/db/client";
import * as schema from "@web-speed-hackathon-2026/server/src/db/schema";
import { findUserByPk, findUserWithPassword } from "@web-speed-hackathon-2026/server/src/db/queries";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const db = getDb();
  const { username, name, description, password } = req.body;

  if (!username || !/^[a-z0-9_-]+$/i.test(username)) {
    return res.status(400).type("application/json").send({ code: "INVALID_USERNAME" });
  }
  if (typeof password !== "string" || password.length === 0) {
    throw new httpErrors.BadRequest();
  }

  const userId = uuidv4();
  const now = new Date().toISOString();
  const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(8));

  try {
    await db.insert(schema.users).values({
      id: userId,
      username,
      name,
      description: description ?? "",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err: any) {
    const cause = err?.cause;
    if (
      cause instanceof LibsqlError &&
      (cause.code === "SQLITE_CONSTRAINT_UNIQUE" || cause.code === "SQLITE_CONSTRAINT")
    ) {
      return res.status(400).type("application/json").send({ code: "USERNAME_TAKEN" });
    }
    throw err;
  }

  const user = await findUserByPk(db, userId);
  req.session.userId = userId;
  return res.status(200).type("application/json").send(user);
});

authRouter.post("/signin", async (req, res) => {
  const db = getDb();
  const user = await findUserWithPassword(db, req.body.username);

  if (!user) {
    throw new httpErrors.BadRequest();
  }
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    throw new httpErrors.BadRequest();
  }

  req.session.userId = user.id;

  const safeUser = await findUserByPk(db, user.id);
  return res.status(200).type("application/json").send(safeUser);
});

authRouter.post("/signout", async (req, res) => {
  req.session.userId = undefined;
  return res.status(200).type("application/json").send({});
});
