import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  const host = "0.0.0.0";
  const port = Number(process.env["PORT"] || 3000);

  const server = app.listen(port, host, () => {
    const address = server.address();
    if (address != null && typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
      return;
    }

    console.log(`Listening on ${host}:${port}`);
  });
}

main().catch(console.error);
