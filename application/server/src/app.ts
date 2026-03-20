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
app.use(sessionMiddleware);
app.use(bodyParser.json());

app.use("/api/v1/images", bodyParser.raw({ limit: "10mb" }));
app.use("/api/v1/movies", bodyParser.raw({ limit: "10mb" }));
app.use("/api/v1/sounds", bodyParser.raw({ limit: "10mb" }));

app.use("/api/v1", (_req, res, next) => {
  res.header("Cache-Control", "no-store");
  return next();
});

app.use("/api/v1", apiRouter);
app.use(prefetchRouter);
app.use(staticRouter);
