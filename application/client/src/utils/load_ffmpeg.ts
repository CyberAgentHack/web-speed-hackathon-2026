import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: (await import("@ffmpeg/core?binary")).default as unknown as string,
    wasmURL: (await import("@ffmpeg/core/wasm?binary")).default as unknown as string,
  });

  return ffmpeg;
}
