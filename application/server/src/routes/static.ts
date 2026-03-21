import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    maxAge: "1m",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    maxAge: "1m",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    index: false,
    maxAge: "1m",
  }),
);

staticRouter.get("/{*splat}", async (req, res, next) => {
  if (/\.[^/]+$/.test(req.path)) {
    return next();
  }

  try {
    const { renderAppHtml } = await import(
      "@web-speed-hackathon-2026/server/src/utils/render_app_html"
    );
    const html = await renderAppHtml(req);
    return res
      .status(200)
      .set("Cache-Control", "no-cache")
      .type("text/html")
      .send(html);
  } catch (error) {
    return next(error);
  }
});
