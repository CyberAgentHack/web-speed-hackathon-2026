import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegPromise: Promise<FFmpeg> | null = null;
let ffmpegTaskQueue: Promise<void> = Promise.resolve();

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegPromise == null) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();

      const [{ default: coreURL }, { default: wasmURL }] = await Promise.all([
        import("@ffmpeg/core?binary"),
        import("@ffmpeg/core/wasm?binary"),
      ]);

      await ffmpeg.load({ coreURL, wasmURL });

      return ffmpeg;
    })();
  }

  return ffmpegPromise;
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
