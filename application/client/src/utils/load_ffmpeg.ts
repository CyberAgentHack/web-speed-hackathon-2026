import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const [coreURL, wasmURL, workerURL] = await Promise.all([
    import("@ffmpeg/core?binary").then(({ default: b }) =>
      URL.createObjectURL(new Blob([b], { type: "text/javascript" })),
    ),
    import("@ffmpeg/core/wasm?binary").then(({ default: b }) =>
      URL.createObjectURL(new Blob([b], { type: "application/wasm" })),
    ),
    import("@ffmpeg/ffmpeg/worker?raw").then(({ default: src }) =>
      URL.createObjectURL(new Blob([src], { type: "text/javascript" })),
    ),
  ]);

  await ffmpeg.load({ coreURL, wasmURL, workerURL });

  return ffmpeg;
}
