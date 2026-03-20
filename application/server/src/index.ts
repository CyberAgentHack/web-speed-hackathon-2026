import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";
import { warmImageCache } from "./warmup";

async function main() {
  await initializeSequelize();

  const port = Number(process.env["PORT"] || 3000);
  const server = app.listen(port, "0.0.0.0", () => {
    const address = server.address();
    if (typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
    }
    // Warm image cache in background after server starts
    warmImageCache(port).catch(() => {});
  });
}

main().catch(console.error);
