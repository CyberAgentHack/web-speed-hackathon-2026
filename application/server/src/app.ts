import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { prefetchRouter } from "@web-speed-hackathon-2026/server/src/routes/prefetch";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(compression());

app.use("/api/v1", sessionMiddleware);
app.use("/api/v1", bodyParser.json());

app.use("/api/v1/images", bodyParser.raw({ limit: "10mb" }));
app.use("/api/v1/movies", bodyParser.raw({ limit: "10mb" }));
app.use("/api/v1/sounds", bodyParser.raw({ limit: "10mb" }));

app.use("/api/v1", (req, res, next) => {
  if (req.method === "GET") {
    res.header("Cache-Control", "private, max-age=5");
  } else {
    res.header("Cache-Control", "no-store");
  }
  return next();
});

app.use("/api/v1", apiRouter);
app.use(sessionMiddleware);
app.use(prefetchRouter);
app.use(staticRouter);
