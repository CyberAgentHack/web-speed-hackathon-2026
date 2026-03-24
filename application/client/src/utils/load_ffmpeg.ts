import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: new URL("/ffmpeg-core.js", location.href).href,
    wasmURL: new URL("/ffmpeg-core.wasm", location.href).href,
  });

  return ffmpeg;
}
