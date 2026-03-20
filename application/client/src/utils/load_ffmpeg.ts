import type { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const { FFmpeg: FFmpegClass } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpegClass();

  await ffmpeg.load({
    coreURL: await import("@ffmpeg/core?binary").then(({ default: url }) => url),
    wasmURL: await import("@ffmpeg/core/wasm?binary").then(({ default: url }) => url),
  });

  return ffmpeg;
}
