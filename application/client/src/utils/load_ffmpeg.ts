import { FFmpeg } from "@ffmpeg/ffmpeg";

/** asset/resource でURLとして出力されたWASMバイナリのパス */
import coreUrl from "@ffmpeg/core?binary";
import wasmUrl from "@ffmpeg/core/wasm?binary";

/**
 * FFmpegインスタンスを初期化して返す。
 * WASMバイナリはasset/resourceとして別ファイルに出力され、実行時にフェッチされる。
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: coreUrl,
    wasmURL: wasmUrl,
  });

  return ffmpeg;
}
