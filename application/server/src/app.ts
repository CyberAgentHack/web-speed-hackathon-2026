import bodyParser from "body-parser";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

// API レスポンスだけ、競技計測中に古いレスポンスを掴みにくい設定にします
app.use("/api/v1", (_req, res, next) => {
  res.header({
    "Cache-Control": "max-age=0, no-transform",
  });
  next();
}, apiRouter);
app.use(staticRouter);
