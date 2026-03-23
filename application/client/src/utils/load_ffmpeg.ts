import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const [coreURL, wasmURL] = await Promise.all([
    import("@ffmpeg/core?binary").then(({ default: url }) => url as unknown as string),
    import("@ffmpeg/core/wasm?binary").then(({ default: url }) => url as unknown as string),
  ]);

  await ffmpeg.load({ coreURL, wasmURL });

  return ffmpeg;
}
