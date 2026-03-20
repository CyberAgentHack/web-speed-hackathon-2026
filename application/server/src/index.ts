import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";
import { initializeCrokCache } from "@web-speed-hackathon-2026/server/src/routes/api/crok";

async function main() {
  await initializeSequelize();
  await initializeCrokCache();

  const server = app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0", () => {
    const address = server.address();
    if (typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
    }
  });
}

main().catch(console.error);
