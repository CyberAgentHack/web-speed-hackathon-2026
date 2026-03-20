import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  const port = Number(process.env["PORT"] || 3000);
  const host = "0.0.0.0";
  app.listen(port, host, () => {
    console.log(`Listening on ${host}:${port}`);
  });
}

main().catch(console.error);
