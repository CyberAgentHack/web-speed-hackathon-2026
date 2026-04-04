import bodyParser from "body-parser";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);
app.use(staticRouter);

app.use("/api/v1", sessionMiddleware);
app.use("/api/v1", bodyParser.json());
app.use("/api/v1", bodyParser.raw({ limit: "10mb" }));

app.use((_req, res, next) => {
  res.header({
    "Cache-Control": "no-store",
  });
  return next();
});

app.use("/api/v1", apiRouter);
