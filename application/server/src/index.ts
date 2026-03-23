import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";
import { warmHtmlCache } from "@web-speed-hackathon-2026/server/src/routes/prefetch";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();
  await warmHtmlCache();

  const server = app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0", () => {
    const address = server.address();
    if (typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
    }
  });
}

main().catch(console.error);
