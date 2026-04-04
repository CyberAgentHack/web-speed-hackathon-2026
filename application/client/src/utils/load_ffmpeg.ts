import { FFmpeg } from "@ffmpeg/ffmpeg";

/** @ffmpeg/core を /ffmpeg 配下の静的ファイルとして配信（CopyWebpackPlugin / devServer.static） */
const FFMPEG_CORE_BASE = "/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: `${FFMPEG_CORE_BASE}/ffmpeg-core.js`,
    wasmURL: `${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`,
  });

  return ffmpeg;
}
