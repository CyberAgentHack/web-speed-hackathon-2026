export async function loadFFmpeg() {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const coreURL = (await import("@ffmpeg/core?url")).default;
  const wasmURL = (await import("@ffmpeg/core/wasm?url")).default;
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL,
    wasmURL,
  });

  return ffmpeg;
}
