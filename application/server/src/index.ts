import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";

function resolveListenPort(): number {
  const raw = process.env["PORT"];
  if (raw === undefined || raw === "") {
    return 3000;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 3000;
}

async function main() {
  await initializeSequelize();

  const listenPort = resolveListenPort();
  const listenHost = "0.0.0.0";

  const server = app.listen(listenPort, listenHost);

  server.once("listening", () => {
    const address = server.address();
    if (address !== null && typeof address === "object" && address.port != null) {
      const host =
        address.address === "0.0.0.0" || address.address === "::"
          ? "localhost"
          : address.address;
      console.log(`Listening on http://${host}:${address.port}/`);
    } else {
      console.log(`Listening on http://localhost:${listenPort}/`);
    }
  });
}

main().catch(console.error);
