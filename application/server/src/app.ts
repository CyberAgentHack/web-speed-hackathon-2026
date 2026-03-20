import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { imageOptimizeRouter } from "@web-speed-hackathon-2026/server/src/routes/image_optimize";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

app.use(compression({
  filter: (req, res) => {
    // Skip compression for already-compressed binary formats
    const type = res.getHeader("Content-Type");
    if (typeof type === "string" && /image|video|audio|wasm|octet-stream/.test(type)) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "100mb" }));

app.use("/api/v1", apiRouter);
app.use(imageOptimizeRouter);
app.use(staticRouter);
