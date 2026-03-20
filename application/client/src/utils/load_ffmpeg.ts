import { FFmpeg } from "@ffmpeg/ffmpeg";

const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

async function internalLoadFFmpeg() {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: `${baseURL}/ffmpeg-core.js`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
  });

  return ffmpeg;
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = await internalLoadFFmpeg();
  return ffmpeg;
}
