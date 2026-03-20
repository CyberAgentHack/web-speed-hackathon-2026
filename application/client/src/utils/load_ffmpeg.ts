import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const [{ default: coreURL }, { default: wasmURL }] = await Promise.all([
    import("@ffmpeg/core?binary"),
    import("@ffmpeg/core/wasm?binary"),
  ]);

  await ffmpeg.load({ coreURL, wasmURL });

  return ffmpeg;
}
