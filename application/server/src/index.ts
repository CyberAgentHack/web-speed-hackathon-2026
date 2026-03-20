import { serve } from "@hono/node-server";

import { app } from "@web-speed-hackathon-2026/server/src/app";
import { injectWebSocket } from "@web-speed-hackathon-2026/server/src/websocket";
import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  const server = serve(
    {
      fetch: app.fetch,
      hostname: "0.0.0.0",
      port: Number(process.env["PORT"] || 3000),
    },
    (info) => {
      console.log(`Listening on ${info.address}:${info.port}`);
    },
  );

  injectWebSocket(server);
}

main().catch(console.error);
