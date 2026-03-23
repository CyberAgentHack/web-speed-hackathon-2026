import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  const rawPort = process.env["PORT"];
  const port = rawPort != null && rawPort !== "" && Number.isFinite(Number(rawPort))
    ? Number(rawPort)
    : 3000;

  const server = app.listen(port, "0.0.0.0");

  server.once("listening", () => {
    const address = server.address();
    if (typeof address === "object" && address !== null) {
      console.log(`Listening on ${address.address}:${address.port}`);
    }
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
}

main().catch(console.error);
