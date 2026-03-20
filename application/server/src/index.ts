import { serve } from "@hono/node-server";
import { app } from "@web-speed-hackathon-2026/server/src/app.ts";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  const port = Number(process.env["PORT"] || 3000);

  console.log(`Listening on 0.0.0.0:${port}`);

  serve({
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0",
  });
}

main().catch(console.error);
