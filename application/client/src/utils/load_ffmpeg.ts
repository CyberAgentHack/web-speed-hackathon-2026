import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const coreURL = (await import("@ffmpeg/core?url")).default;
  const wasmURL = (await import("@ffmpeg/core/wasm?url")).default;
  await ffmpeg.load({ coreURL, wasmURL });

  return ffmpeg;
}
