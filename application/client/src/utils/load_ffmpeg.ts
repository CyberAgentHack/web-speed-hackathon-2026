export async function loadFFmpeg(): Promise<any> {
  // Dynamic import to avoid bundling ffmpeg into the main bundle
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await import("@ffmpeg/core?binary").then(({ default: b }) => {
      return URL.createObjectURL(new Blob([b], { type: "text/javascript" }));
    }),
    wasmURL: await import("@ffmpeg/core/wasm?binary").then(({ default: b }) => {
      return URL.createObjectURL(new Blob([b], { type: "application/wasm" }));
    }),
  });

  return ffmpeg;
}
