import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";

async function main() {
  await initializeSequelize();

  // Pre-compute waveforms for all sounds to warm cache
  try {
    const { Sound } = await import("@web-speed-hackathon-2026/server/src/models");
    const { computeWaveform } =
      await import("@web-speed-hackathon-2026/server/src/routes/api/sound");
    const sounds = await Sound.findAll();
    await Promise.all(sounds.map((s) => computeWaveform(s.id).catch(() => {})));
    console.log(`Pre-computed waveforms for ${sounds.length} sounds`);
  } catch (err) {
    console.warn("Failed to pre-compute waveforms:", err);
  }

  const server = app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0", () => {
    const address = server.address();
    if (typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
    }
  });
}

main().catch(console.error);
