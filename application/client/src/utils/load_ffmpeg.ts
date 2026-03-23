import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: "/static/ffmpeg-core.js",
    wasmURL: "/static/ffmpeg-core.wasm",
  });

  return ffmpeg;
}
