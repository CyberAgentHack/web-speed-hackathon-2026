import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function createFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await import("@ffmpeg/core?binary").then(({ default: b }) => {
      return URL.createObjectURL(new Blob([b], { type: "text/javascript" }));
    }),
    wasmURL: await import("@ffmpeg/core/wasm?binary").then(({ default: b }) => {
      return URL.createObjectURL(new Blob([b], { type: "application/wasm" }));
    }),
  });

  return ffmpeg;
}

export async function preloadFFmpeg(): Promise<void> {
  ffmpegPromise ??= createFFmpeg();
  await ffmpegPromise;
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  ffmpegPromise ??= createFFmpeg();
  return await ffmpegPromise;
}
