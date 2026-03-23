import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  const port = Number(process.env["PORT"] || 3000);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Listening on 0.0.0.0:${port}`);
  });
}

main().catch(console.error);
