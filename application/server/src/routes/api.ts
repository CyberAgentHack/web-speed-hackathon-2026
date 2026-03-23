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

export const apiApp = new Hono();

apiApp.route("/", initializeRouter);
apiApp.route("/", userRouter);
apiApp.route("/", postRouter);
apiApp.route("/", directMessageRouter);
apiApp.route("/", searchRouter);
apiApp.route("/", movieRouter);
apiApp.route("/", imageRouter);
apiApp.route("/", soundRouter);
apiApp.route("/", authRouter);
apiApp.route("/", crokRouter);

// Error handling
apiApp.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json({ message: "Bad Request" }, 400);
  }
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: "Internal Server Error" }, 500);
});
