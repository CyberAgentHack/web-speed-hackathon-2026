import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: '/wasm/ffmpeg-core.js',
    wasmURL: '/wasm/ffmpeg-core.wasm',
  });

  return ffmpeg;
}
