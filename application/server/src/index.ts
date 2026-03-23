import "./utils/express_websocket_support";
import { app } from "./app";

import { initializeSequelize } from "./sequelize";
import { initializeVideos } from "./utils/video_initializer";

async function main() {
  await initializeSequelize();
  await initializeVideos();

  const server = app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0", () => {
    const address = server.address();
    if (address && typeof address === "object") {
      console.log(`Listening on ${address.address}:${address.port}`);
    } else if (typeof address === "string") {
      console.log(`Listening on ${address}`);
    }
  });
}

main().catch(console.error);
