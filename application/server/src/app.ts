import bodyParser from "body-parser";
import compression from "compression";
import Express, { Request, Response } from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(
  compression({
    filter: (req: Request, res: Response) => {
      const contentType = `${res.getHeader("Content-Type") || ""}`.toLowerCase();
      if (contentType.startsWith("text/event-stream")) {
        return false;
      }
      if ((req.headers.accept || "").includes("text/event-stream")) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use("/api/v1", (_req, res, next) => {
  if (!res.hasHeader("Cache-Control")) {
    res.setHeader("Cache-Control", "private, no-store");
  }
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
