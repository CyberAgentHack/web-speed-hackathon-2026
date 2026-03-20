import bodyParser from "body-parser";
import Express from "express";
import morgan from "morgan";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { imageResizeRouter } from "@web-speed-hackathon-2026/server/src/routes/image_resize";
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

app.use("/api/v1", (req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=60");
  }
  next();
});
app.use("/api/v1", apiRouter);
app.use(imageResizeRouter);
app.use(staticRouter);
