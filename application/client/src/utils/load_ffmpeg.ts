import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await fetch("/ffmpeg/ffmpeg-core.js").then((r) => r.blob()).then((b) => URL.createObjectURL(new Blob([b], { type: "text/javascript" }))),
    wasmURL: await fetch("/ffmpeg/ffmpeg-core.wasm").then((r) => r.blob()).then((b) => URL.createObjectURL(new Blob([b], { type: "application/wasm" }))),
  });

  return ffmpeg;
}
