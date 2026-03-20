export async function loadFFmpeg() {
  // Dynamic import: @ffmpeg/ffmpeg is only loaded when video/audio processing is needed
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
