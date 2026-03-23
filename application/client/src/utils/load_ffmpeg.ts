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

export function loadFFmpeg(): Promise<FFmpeg> {
  ffmpegPromise ??= createFFmpeg();
  return ffmpegPromise;
}

export function releaseFFmpeg(): void {
  if (ffmpegPromise != null) {
    ffmpegPromise.then((ffmpeg) => ffmpeg.terminate()).catch(() => {});
    ffmpegPromise = null;
  }
}

export function warmUpFFmpeg(): Promise<FFmpeg> {
  return loadFFmpeg();
}
