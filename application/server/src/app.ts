import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(compression());
app.use(sessionMiddleware);

// favicon.ico への 404 エラーを抑制するために 204 (No Content) を返す
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.header({
      "Cache-Control": "max-age=0, no-transform",
    });
  }
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
