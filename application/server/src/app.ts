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
      if (res.getHeader("Content-Type") === "text/event-stream") return false;
      return compression.filter(req, res);
    },
  }),
);
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use((req, res, next) => {
  // Immutable cache for fonts (1 year)
  if (req.path.startsWith("/fonts/")) {
    res.header({
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  } else {
    res.header({
      "Cache-Control": "max-age=0, no-cache",
    });
  }
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
