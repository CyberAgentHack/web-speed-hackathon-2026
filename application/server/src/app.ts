import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ValidationError } from "sequelize";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

export const app = new Hono<AppEnv>();

app.use("*", sessionMiddleware);

app.route("/api/v1", apiRouter);
app.route("/", staticRouter);

app.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json({ message: "Bad Request" }, 400);
  }
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: "Internal Server Error" }, 500);
});
