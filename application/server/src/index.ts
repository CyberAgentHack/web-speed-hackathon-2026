import { app } from "@web-speed-hackathon-2026/server/src/app";
import { websocket } from "@web-speed-hackathon-2026/server/src/ws";

import { initializeSequelize } from "./sequelize";

await initializeSequelize();

const server = Bun.serve({
  port: Number(process.env["PORT"] || 3000),
  fetch: app.fetch,
  websocket,
});

console.log(`Listening on ${server.hostname}:${server.port}`);
