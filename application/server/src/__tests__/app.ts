import { createHonoTestApp } from "./helpers";

const { app: honoApp } = await import("@web-speed-hackathon-2026/server/src/app");
const { websocket } = await import("@web-speed-hackathon-2026/server/src/ws");

export const app = await createHonoTestApp(honoApp, websocket);
