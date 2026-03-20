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
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use((req, res, next) => {
  if (req.path.match(/\.[a-f0-9]{8}\.(js|css)$/) || req.path.match(/\.(woff2|woff|ttf|otf)$/)) {
    res.header({ "Cache-Control": "public, max-age=31536000, immutable" });
  } else {
    res.header({ "Cache-Control": "no-cache" });
  }
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
