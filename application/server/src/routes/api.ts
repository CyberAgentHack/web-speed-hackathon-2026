import { Router, NextFunction, Request, Response } from "express";
import httpErrors from "http-errors";
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
import { translateRouter } from "@web-speed-hackathon-2026/server/src/routes/api/translate";
import { userRouter } from "@web-speed-hackathon-2026/server/src/routes/api/user";

export const apiRouter = Router();

// パブリック GET に短期キャッシュ + stale-while-revalidate を設定
// プライベート系ルート (me / dm / crok) は個別に private, no-store を設定
apiRouter.use((req, res, next) => {
  if (req.method === "GET") {
    const path = req.path;
    if (
      path.startsWith("/me") ||
      path.startsWith("/dm") ||
      path.startsWith("/crok")
    ) {
      res.setHeader("Cache-Control", "private, no-store");
    } else {
      res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=60");
    }
  }
  next();
});

apiRouter.use(initializeRouter);
apiRouter.use(userRouter);
apiRouter.use(postRouter);
apiRouter.use(directMessageRouter);
apiRouter.use(searchRouter);
apiRouter.use(movieRouter);
apiRouter.use(imageRouter);
apiRouter.use(soundRouter);
apiRouter.use(authRouter);
apiRouter.use(translateRouter);
apiRouter.use(crokRouter);

apiRouter.use(async (err: Error, _req: Request, _res: Response, _next: NextFunction) => {
  if (err instanceof ValidationError) {
    throw new httpErrors.BadRequest();
  }
  throw err;
});

apiRouter.use(async (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (!httpErrors.isHttpError(err) || err.status === 500) {
    console.error(err);
  }

  return res
    .status(httpErrors.isHttpError(err) ? err.status : 500)
    .type("application/json")
    .send({
      message: err.message,
    });
});
