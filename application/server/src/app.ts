import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(
  compression({
    filter: (req, res) => {
      if (req.path === "/api/v1/crok") return false;
      return compression.filter(req, res);
    },
  }),
);

app.use("/api/v1", sessionMiddleware);
app.use("/api/v1", bodyParser.json());
app.use("/api/v1", bodyParser.raw({ limit: "10mb" }));

app.use((_req, res, next) => {
  if (_req.path.startsWith("/api/")) {
    res.header("Cache-Control", "no-cache");
  }
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
