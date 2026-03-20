export async function loadFFmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();
  const coreURL = (await import("@ffmpeg/core?binary")).default;
  const wasmURL = (await import("@ffmpeg/core/wasm?binary")).default;

  await ffmpeg.load({ coreURL, wasmURL });

  return ffmpeg;
}
