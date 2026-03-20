import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await import(/** webpackChunkName: "ffmpeg-core" */ "@ffmpeg/core?binary").then(
      ({ default: b }) => {
        return URL.createObjectURL(new Blob([b], { type: "text/javascript" }));
      },
    ),
    wasmURL: await import(/** webpackChunkName: "ffmpeg-wasm" */ "@ffmpeg/core/wasm?binary").then(
      ({ default: b }) => {
        return URL.createObjectURL(new Blob([b], { type: "application/wasm" }));
      },
    ),
  });

  return ffmpeg;
}
