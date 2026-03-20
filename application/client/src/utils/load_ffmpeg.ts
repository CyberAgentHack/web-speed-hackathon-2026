import { FFmpeg } from "@ffmpeg/ffmpeg";
import coreURL from "@ffmpeg/core?binary";
import wasmURL from "@ffmpeg/core/wasm?binary";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({ coreURL, wasmURL });

  return ffmpeg;
}
