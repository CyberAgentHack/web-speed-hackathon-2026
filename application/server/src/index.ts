import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";
import { warmImageCache } from "@web-speed-hackathon-2026/server/src/routes/image_optimize";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  const server = app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0", () => {
    const address = server.address();
    if (typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
    }
  });

  // サーバー起動後にバックグラウンドで画像キャッシュを事前生成する
  warmImageCache().catch(console.error);
}

main().catch(console.error);
