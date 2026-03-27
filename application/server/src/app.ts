import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers.accept?.includes("text/event-stream")) return false;
      return compression.filter(req, res);
    },
  }),
);

app.use((_req, res, next) => {
  res.header({
    Connection: "close",
  });
  return next();
});

app.use(
  "/api/v1",
  (_req, res, next) => {
    res.header({ "Cache-Control": "no-cache" });
    return next();
  },
  apiRouter,
);
app.use(staticRouter);
