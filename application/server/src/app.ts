import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { compress } from "hono/compress";

import { sessionMiddleware, type SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

export const app = new Hono<SessionEnv>();

export const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });

app.use(compress());
app.use("*", sessionMiddleware);

// Routes are registered after app is created to avoid circular imports
async function registerRoutes() {
  const { apiRouter } = await import("@web-speed-hackathon-2026/server/src/routes/api");
  const { imageOptimizationRouter } =
    await import("@web-speed-hackathon-2026/server/src/routes/image_optimization");
  const { staticRouter } = await import("@web-speed-hackathon-2026/server/src/routes/static");

  app.route("/api/v1", apiRouter);
  app.route("", imageOptimizationRouter);
  app.route("", staticRouter);
}

export const routesReady = registerRoutes();
