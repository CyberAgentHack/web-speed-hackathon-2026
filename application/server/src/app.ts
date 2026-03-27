import { Hono } from "hono";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { ValidationError } from "sequelize";

import { authRouter } from "@web-speed-hackathon-2026/server/src/routes/api/auth";
import { crokRouter } from "@web-speed-hackathon-2026/server/src/routes/api/crok";
import { directMessageRouter } from "@web-speed-hackathon-2026/server/src/routes/api/direct_message";
import { imageRouter } from "@web-speed-hackathon-2026/server/src/routes/api/image";
import { initializeRouter } from "@web-speed-hackathon-2026/server/src/routes/api/initialize";
import { movieRouter } from "@web-speed-hackathon-2026/server/src/routes/api/movie";
import { postRouter } from "@web-speed-hackathon-2026/server/src/routes/api/post";
import { searchRouter } from "@web-speed-hackathon-2026/server/src/routes/api/search";
import { soundRouter } from "@web-speed-hackathon-2026/server/src/routes/api/sound";
import { userRouter } from "@web-speed-hackathon-2026/server/src/routes/api/user";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";

export const app = new Hono<Env>();

app.use(compress());
app.use(sessionMiddleware);

app.use("/api/v1/*", async (c, next) => {
  c.header("Cache-Control", "no-cache, no-transform");
  await next();
});

app.route("/api/v1", initializeRouter);
app.route("/api/v1", userRouter);
app.route("/api/v1", postRouter);
app.route("/api/v1", directMessageRouter);
app.route("/api/v1", searchRouter);
app.route("/api/v1", movieRouter);
app.route("/api/v1", imageRouter);
app.route("/api/v1", soundRouter);
app.route("/api/v1", authRouter);
app.route("/api/v1", crokRouter);
app.route("/", staticRouter);

app.onError((err, c) => {
  const pathname = new URL(c.req.url).pathname;
  if (!pathname.startsWith("/api/v1/")) {
    if (err instanceof HTTPException) {
      return c.text(err.message, err.status);
    }
    console.error(err);
    return c.text(err.message, 500);
  }

  if (err instanceof ValidationError || err instanceof SyntaxError) {
    return c.json({ message: "Bad Request" }, 400);
  }
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: err.message }, 500);
});

app.notFound((c) => {
  const pathname = new URL(c.req.url).pathname;
  if (pathname.startsWith("/api/v1/")) {
    return c.json({ message: "Not Found" }, 404);
  }
  return c.text("404 Not Found", 404);
});
