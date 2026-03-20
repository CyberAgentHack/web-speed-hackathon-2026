import { Hono } from "hono";
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
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

export const apiRouter = new Hono<SessionEnv>();

apiRouter.route("", initializeRouter);
apiRouter.route("", userRouter);
apiRouter.route("", postRouter);
apiRouter.route("", directMessageRouter);
apiRouter.route("", searchRouter);
apiRouter.route("", movieRouter);
apiRouter.route("", imageRouter);
apiRouter.route("", soundRouter);
apiRouter.route("", authRouter);
apiRouter.route("", crokRouter);

apiRouter.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json({ message: "Bad Request" }, 400);
  }
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: err.message }, 500);
});
