import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegPromise: Promise<FFmpeg> | null = null;

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegPromise === null) {
    ffmpegPromise = (async () => {
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
    })();
  }

  return ffmpegPromise;
}
