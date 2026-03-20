import { FFmpeg } from "@ffmpeg/ffmpeg";
import coreUrl from "@ffmpeg/core?url";
import wasmUrl from "@ffmpeg/core/wasm?url";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: coreUrl,
    wasmURL: wasmUrl,
  });

  return ffmpeg;
}
