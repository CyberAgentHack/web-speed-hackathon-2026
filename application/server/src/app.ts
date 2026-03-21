import { Hono } from "hono";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { createSessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = new Hono();

// Session middleware
app.use(createSessionMiddleware());

// JSON body parsing middleware
app.use(async (c, next) => {
  const contentType = c.req.header("content-type") || "";
  if (
    (c.req.method === "POST" || c.req.method === "PUT" || c.req.method === "PATCH") &&
    contentType.includes("application/json")
  ) {
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
  const contentType = c.req.header("content-type") || "";
  if (
    (c.req.method === "POST" || c.req.method === "PUT") &&
    contentType.includes("application/octet-stream")
  ) {
    const buf = await c.req.arrayBuffer();
    c.set("rawBody" as never, Buffer.from(buf) as never);
  }
  await next();
});

app.use("/api/*", async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
});

app.use("*", async (c, next) => {
  await next();

  if (c.req.path.startsWith("/api/")) {
    return;
  }

  if (c.req.path.endsWith(".html") || c.req.path === "/") {
    c.header("Cache-Control", "no-cache");
    return;
  }

  c.header("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
});

// API router
app.route("/api/v1", apiRouter);

// Static router
app.route("/", staticRouter);
