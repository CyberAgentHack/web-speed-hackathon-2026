import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const coreURL = (await import("@ffmpeg/core?binary")).default as unknown as string;
  const wasmURL = (await import("@ffmpeg/core/wasm?binary")).default as unknown as string;

  await ffmpeg.load({ coreURL, wasmURL });

  return ffmpeg;
}
