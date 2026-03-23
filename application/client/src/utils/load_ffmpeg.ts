import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: "/scripts/ffmpeg-core.js",
    wasmURL: "/scripts/ffmpeg-core.wasm",
  });

  return ffmpeg;
}
