import { FFmpeg } from "@ffmpeg/ffmpeg";

interface FFmpegAssetURLs {
  coreURL: string;
  wasmURL: string;
  workerURL: string;
}

let ffmpegAssetsPromise: Promise<FFmpegAssetURLs> | null = null;

function loadFFmpegAssets(): Promise<FFmpegAssetURLs> {
  if (ffmpegAssetsPromise != null) {
    return ffmpegAssetsPromise;
  }

  ffmpegAssetsPromise = Promise.all([
    import("@ffmpeg/core?binary").then(({ default: b }) =>
      URL.createObjectURL(new Blob([b], { type: "text/javascript" })),
    ),
    import("@ffmpeg/core/wasm?binary").then(({ default: b }) =>
      URL.createObjectURL(new Blob([b], { type: "application/wasm" })),
    ),
    import("@ffmpeg/ffmpeg/worker?raw").then(({ default: src }) =>
      URL.createObjectURL(new Blob([src], { type: "text/javascript" })),
    ),
  ]).then(([coreURL, wasmURL, workerURL]) => ({
    coreURL,
    wasmURL,
    workerURL,
  }));

  return ffmpegAssetsPromise;
}

export function preloadFFmpegAssets(): void {
  void loadFFmpegAssets();
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const { coreURL, wasmURL, workerURL } = await loadFFmpegAssets();

  await ffmpeg.load({ coreURL, wasmURL, workerURL });

  return ffmpeg;
}
