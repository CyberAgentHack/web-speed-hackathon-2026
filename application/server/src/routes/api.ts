import { Hono } from "hono";

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
import { ValidationError } from "sequelize";

export const apiRouter = new Hono();

apiRouter.route("/", initializeRouter);
apiRouter.route("/", userRouter);
apiRouter.route("/", postRouter);
apiRouter.route("/", directMessageRouter);
apiRouter.route("/", searchRouter);
apiRouter.route("/", movieRouter);
apiRouter.route("/", imageRouter);
apiRouter.route("/", soundRouter);
apiRouter.route("/", authRouter);
apiRouter.route("/", crokRouter);

apiRouter.onError(async (err, c) => {
  if (err instanceof ValidationError) {
    return c.json({ message: "Bad Request" }, 400);
  }

  if (!(err instanceof Error)) {
    return c.json({ message: "Internal Server Error" }, 500);
  }

  if (!("status" in err) || (err as any).status === 500) {
    console.error(err);
  }

  const statusCode = (err as any).status || 500;
  return c.json({ message: err.message }, statusCode);
});
