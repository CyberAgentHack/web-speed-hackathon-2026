import { compress } from "hono/compress";

import { apiApp } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticApp } from "@web-speed-hackathon-2026/server/src/routes/static";
import { honoApp } from "@web-speed-hackathon-2026/server/src/websocket";

honoApp.use(compress());

honoApp.use("/api/v1/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  await next();
});

honoApp.route("/api/v1", apiApp);
honoApp.route("/", staticApp);

export const app = honoApp;
