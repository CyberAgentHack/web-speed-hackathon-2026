import { FFmpeg } from "@ffmpeg/ffmpeg";

import coreUrl from "@ffmpeg/core?binary";
import wasmUrl from "@ffmpeg/core/wasm?binary";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: coreUrl,
    wasmURL: wasmUrl,
  });

  return ffmpeg;
}
