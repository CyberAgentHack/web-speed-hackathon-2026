import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const [coreURLModule, wasmURLModule] = await Promise.all([
    import(/** webpackChunkName: "ffmpeg-core" */ "@ffmpeg/core?url"),
    import(/** webpackChunkName: "ffmpeg-wasm" */ "@ffmpeg/core/wasm?url"),
  ]);

  await ffmpeg.load({
    coreURL: new URL(coreURLModule.default, window.location.href).toString(),
    wasmURL: new URL(wasmURLModule.default, window.location.href).toString(),
  });

  return ffmpeg;
}
