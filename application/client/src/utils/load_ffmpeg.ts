export async function loadFFmpeg() {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: "/wasm/ffmpeg-core.js",
    wasmURL: "/wasm/ffmpeg-core.wasm",
  });

  return ffmpeg;
}
