import type { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  // `@ffmpeg/ffmpeg` 自体も非常に重いので、変換処理が必要なタイミングまで遅延ロードします
  const { FFmpeg: FFmpegCtor } = await import(/* webpackChunkName: "ffmpeg" */ "@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpegCtor();

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
