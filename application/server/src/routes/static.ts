import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { CLIENT_DIST_PATH, PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// 拡張子がついてるリクエストは index.html に書き換えて CLIENT_DIST_PATH に引っかける
// ついてないリクエストはそのまま通して他のルーターに引っかける
staticRouter.use(history());

staticRouter.use(serveStatic(UPLOAD_PATH));

staticRouter.use(serveStatic(PUBLIC_PATH));

staticRouter.use(serveStatic(CLIENT_DIST_PATH));
