import type { FFmpeg } from "@ffmpeg/ffmpeg";

let _ffmpegPromise: Promise<FFmpeg> | null = null;

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (_ffmpegPromise) return _ffmpegPromise;
  _ffmpegPromise = (async () => {
    const [{ FFmpeg }, { default: coreUrl }, { default: wasmUrl }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/core?url"),
      import("@ffmpeg/core/wasm?url"),
    ]);
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL: coreUrl, wasmURL: wasmUrl });
    return ffmpeg;
  })();
  return _ffmpegPromise;
}
