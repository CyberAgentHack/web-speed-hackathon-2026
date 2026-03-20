import { Hono } from "hono";
import { createSessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";

export const app = new Hono();

// Session middleware
app.use(createSessionMiddleware());

// JSON body parsing middleware
app.use(async (c, next) => {
  if (c.req.method === "POST" || c.req.method === "PUT" || c.req.method === "PATCH") {
    try {
      const body = await c.req.json();
      c.set("body" as never, body as never);
    } catch {
      c.set("body" as never, {} as never);
    }
  }
  await next();
});

// Raw body parsing middleware
app.use(async (c, next) => {
  if ((c.req.method === "POST" || c.req.method === "PUT") && c.req.header("content-type") === "application/octet-stream") {
    const buf = await c.req.arrayBuffer();
    c.set("rawBody" as never, Buffer.from(buf) as never);
  }
  await next();
});

// Cache control headers
app.use(async (c, next) => {
  c.header("Cache-Control", "max-age=0, no-transform");
  c.header("Connection", "close");
  await next();
});

// API router
app.route("/api/v1", apiRouter);

// Static router
app.route("/", staticRouter);
