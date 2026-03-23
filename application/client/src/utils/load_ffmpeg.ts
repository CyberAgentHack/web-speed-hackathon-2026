import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegPromise: Promise<FFmpeg> | null = null;
let ffmpegTempFileCounter = 0;

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegPromise != null) {
    return ffmpegPromise;
  }

  const ffmpeg = new FFmpeg();
  ffmpegPromise = (async () => {
    const coreURL = await import("@ffmpeg/core?binary").then(({ default: b }) => {
      return URL.createObjectURL(new Blob([b], { type: "text/javascript" }));
    });
    const wasmURL = await import("@ffmpeg/core/wasm?binary").then(({ default: b }) => {
      return URL.createObjectURL(new Blob([b], { type: "application/wasm" }));
    });

    try {
      await ffmpeg.load({
        coreURL,
        wasmURL,
      });
      return ffmpeg;
    } catch (error) {
      ffmpegPromise = null;
      throw error;
    } finally {
      URL.revokeObjectURL(coreURL);
      URL.revokeObjectURL(wasmURL);
    }
  })();

  return ffmpegPromise;
}

export function createFFmpegTempFileName(prefix: string, extension?: string): string {
  ffmpegTempFileCounter += 1;
  const suffix = `${Date.now()}-${ffmpegTempFileCounter}`;
  if (extension == null || extension.length === 0) {
    return `${prefix}-${suffix}`;
  }
  return `${prefix}-${suffix}.${extension}`;
}
