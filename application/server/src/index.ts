import { app, websocket, routesReady } from "@web-speed-hackathon-2026/server/src/app";

import { initializeDb } from "./db";

async function main() {
  await initializeDb();
  await routesReady;

  const port = Number(process.env["PORT"] || 3000);
  Bun.serve({
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0",
    websocket,
  });
  console.log(`Listening on 0.0.0.0:${port}`);
}

main().catch(console.error);
