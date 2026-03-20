import type { FFmpeg } from "@ffmpeg/ffmpeg";

// Use absolute paths to avoid Vite alias double-resolution
const coreModulePath = new URL(
  "../../node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js",
  import.meta.url,
).pathname;
const wasmModulePath = new URL(
  "../../node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm",
  import.meta.url,
).pathname;

export async function loadFFmpeg(): Promise<FFmpeg> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: coreModulePath,
    wasmURL: wasmModulePath,
  });

  return ffmpeg;
}
