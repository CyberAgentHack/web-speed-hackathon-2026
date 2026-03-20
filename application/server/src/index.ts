import { serve } from "@hono/node-server";

import { app, injectWebSocket, routesReady } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();
  await routesReady;

  const port = Number(process.env["PORT"] || 3000);
  const server = serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
    console.log(`Listening on 0.0.0.0:${port}`);
  });
  injectWebSocket(server);
}

main().catch(console.error);
