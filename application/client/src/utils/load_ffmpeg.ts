import type { FFmpeg } from "@ffmpeg/ffmpeg";

// dynamic import で FFmpeg WASM (~41MB) を初期バンドルから除外し、使用時にのみロードする
export async function loadFFmpeg(): Promise<FFmpeg> {
  const { FFmpeg: FFmpegClass } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpegClass();

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
