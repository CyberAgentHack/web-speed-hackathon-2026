import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { initializeSequelize } from "./sequelize.js";
import { initWebSocket, injectWebSocket } from "./ws.js";

async function main() {
  await initializeSequelize();

  initWebSocket(app);

  const server = serve(
    {
      fetch: app.fetch,
      port: Number(process.env["PORT"] || 3000),
      hostname: "0.0.0.0",
    },
    (info) => {
      console.log(`Listening on ${info.address}:${info.port}`);
    },
  );

  injectWebSocket(server);
}

main().catch(console.error);
