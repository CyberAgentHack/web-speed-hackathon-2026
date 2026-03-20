import bodyParser from "body-parser";
import Express from "express";
import morgan from "morgan";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

if (process.env['NODE_ENV'] === 'development') {
  console.log('Development mode');
  app.use(morgan("dev"));
}
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use((_req, res, next) => {
  res.header({
    "Cache-Control": "max-age=7d, no-transform",
    Connection: "close",
  });
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
