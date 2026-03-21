import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegPromise: Promise<FFmpeg> | undefined;
let ffmpegTaskQueue: Promise<void> = Promise.resolve();

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegPromise != null) {
    return ffmpegPromise;
  }

  ffmpegPromise = (async () => {
    const ffmpeg = new FFmpeg();
    const [{ default: coreURL }, { default: wasmURL }] = await Promise.all([
      import("@ffmpeg/core?binary"),
      import("@ffmpeg/core/wasm?binary"),
    ]);

    await ffmpeg.load({ coreURL, wasmURL });
    return ffmpeg;
  })().catch((err) => {
    ffmpegPromise = undefined;
    throw err;
  });

  return ffmpegPromise;
}

export function releaseFFmpeg() {
  if (ffmpegPromise == null) {
    return;
  }

  void ffmpegPromise
    .then((ffmpeg) => {
      ffmpeg.terminate();
    })
    .catch(() => undefined);

  ffmpegPromise = undefined;
  ffmpegTaskQueue = Promise.resolve();
}

export async function withFFmpeg<T>(task: (ffmpeg: FFmpeg) => Promise<T>): Promise<T> {
  const runTask = async () => {
    const ffmpeg = await loadFFmpeg();
    return task(ffmpeg);
  };

  const taskResult = ffmpegTaskQueue.then(runTask, runTask);
  ffmpegTaskQueue = taskResult.then(
    () => undefined,
    () => undefined,
  );

  return taskResult;
}
