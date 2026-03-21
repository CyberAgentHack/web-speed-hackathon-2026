import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { renderAppHtml } from "@web-speed-hackathon-2026/server/src/utils/render_app_html";

export const staticRouter = Router();

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    index: false,
    lastModified: false,
  }),
);

staticRouter.get("/{*splat}", async (req, res, next) => {
  if (/\.[^/]+$/.test(req.path)) {
    return next();
  }

  try {
    const html = await renderAppHtml(req);
    return res.status(200).type("text/html").send(html);
  } catch (error) {
    return next(error);
  }
});
