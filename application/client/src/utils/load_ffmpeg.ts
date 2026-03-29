let ffmpegInstance: any = null;
let ffmpegLoadPromise: Promise<any> | null = null;

export async function loadFFmpeg(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;

  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();

      await ffmpeg.load({
        coreURL: await import("@ffmpeg/core?binary").then(({ default: url }) => url as unknown as string),
        wasmURL: await import("@ffmpeg/core/wasm?binary").then(({ default: url }) => url as unknown as string),
      });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();
  }

  return await ffmpegLoadPromise;
}
