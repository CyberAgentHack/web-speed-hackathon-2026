import { FFmpeg } from "@ffmpeg/ffmpeg";

import coreUrl from "@ffmpeg/core?binary";
import wasmUrl from "@ffmpeg/core/wasm?binary";

let cachedFFmpeg: FFmpeg | null = null;

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (cachedFFmpeg !== null) {
    return cachedFFmpeg;
  }

  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: coreUrl,
    wasmURL: wasmUrl,
  });

  cachedFFmpeg = ffmpeg;
  return ffmpeg;
}
