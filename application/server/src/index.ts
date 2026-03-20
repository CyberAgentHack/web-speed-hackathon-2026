import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { execSync } from "child_process";
// @ts-expect-error - fluent-ffmpeg does not have types
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
// @ts-expect-error - ffprobe-static does not have types
import ffprobeStatic from "ffprobe-static";

// Set global paths for fluent-ffmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

import { app } from "@web-speed-hackathon-2026/server/src/app";
import { initializeSequelize } from "./sequelize";

async function checkBinaries() {
  if (ffmpegStatic) {
    try {
      execSync(`"${ffmpegStatic}" -version`, { stdio: "ignore" });
      console.log(`FFmpeg found at: ${ffmpegStatic}`);
    } catch {
      console.error(`FFmpeg binary not found or not working at: ${ffmpegStatic}`);
    }
  } else {
    console.warn("ffmpeg-static returned null");
  }

  if (ffprobeStatic.path) {
    try {
      execSync(`"${ffprobeStatic.path}" -version`, { stdio: "ignore" });
      console.log(`FFprobe found at: ${ffprobeStatic.path}`);
    } catch {
      console.error(`FFprobe binary not found or not working at: ${ffprobeStatic.path}`);
    }
  } else {
     console.warn("ffprobe-static returned null");
  }
}

async function main() {
  await checkBinaries();
  await initializeSequelize();

  const server = app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0", () => {
    const address = server.address();
    if (typeof address === "object") {
      console.log(`Listening on ${address?.address}:${address?.port}`);
    }
  });
}

main().catch(console.error);
