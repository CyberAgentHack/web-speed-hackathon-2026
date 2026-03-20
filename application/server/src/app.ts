import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { imageOptimizerRouter } from "@web-speed-hackathon-2026/server/src/routes/image_optimizer";
import { movieOptimizerRouter } from "@web-speed-hackathon-2026/server/src/routes/movie_optimizer";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(compression({
  filter: (req, res) => {
    if (req.headers.accept === "text/event-stream") {
      return false;
    }
    return compression.filter(req, res);
  },
}));
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use("/api/v1", (_req, res, next) => {
  res.header({
    "Cache-Control": "no-cache, no-transform",
  });
  return next();
}, apiRouter);
app.use(imageOptimizerRouter);
app.use(movieOptimizerRouter);
app.use(staticRouter);
