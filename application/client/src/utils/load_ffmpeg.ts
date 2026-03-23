import { FFmpeg } from "@ffmpeg/ffmpeg";

let coreURLCache: string | undefined;
let wasmURLCache: string | undefined;

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  if (coreURLCache === undefined || wasmURLCache === undefined) {
    coreURLCache = (await import("@ffmpeg/core?url")).default;
    wasmURLCache = (await import("@ffmpeg/core/wasm?url")).default;
  }

  await ffmpeg.load({ coreURL: coreURLCache, wasmURL: wasmURLCache });

  return ffmpeg;
}
