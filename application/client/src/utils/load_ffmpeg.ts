// @ts-expect-error -- ?url suffix returns a string URL, no type declaration needed
import coreURL from "@ffmpeg/core?url";
// @ts-expect-error -- ?url suffix returns a string URL, no type declaration needed
import wasmURL from "@ffmpeg/core/wasm?url";
import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL,
    wasmURL,
  });

  return ffmpeg;
}
