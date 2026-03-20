import { FFmpeg } from "@ffmpeg/ffmpeg";
import ffmpegCoreUrl from "@ffmpeg/core?url";
import ffmpegWasmUrl from "@ffmpeg/core/wasm?url";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: ffmpegCoreUrl,
    wasmURL: ffmpegWasmUrl,
  });

  return ffmpeg;
}
