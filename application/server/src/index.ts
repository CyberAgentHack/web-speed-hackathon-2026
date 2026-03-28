import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";
import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/sentiment";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  // kuromoji の辞書読み込みを listen 前に完了させる（await することでテスト中のブロックを防ぐ）
  await analyzeSentiment("起動").catch(() => {});

  const server = app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0", () => {
    const address = server.address();
    if (typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
    }
  });
}

main().catch(console.error);
