import { FFmpeg } from "@ffmpeg/ffmpeg";

import coreUrl from "@ffmpeg/core?url";
import wasmUrl from "@ffmpeg/core/wasm?url";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await fetch(coreUrl).then(async (r) => {
      const b = await r.arrayBuffer();
      return URL.createObjectURL(new Blob([b], { type: "text/javascript" }));
    }),
    wasmURL: await fetch(wasmUrl).then(async (r) => {
      const b = await r.arrayBuffer();
      return URL.createObjectURL(new Blob([b], { type: "application/wasm" }));
    }),
  });

  return ffmpeg;
}
