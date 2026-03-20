import { FFmpeg } from "@ffmpeg/ffmpeg";

/** asset/resource でURLとして出力されたWASMバイナリのパス */
import coreUrl from "@ffmpeg/core?binary";
import wasmUrl from "@ffmpeg/core/wasm?binary";

/** FFmpegインスタンスのシングルトンキャッシュ */
let cachedFFmpeg: FFmpeg | null = null;
/** ロード中のPromise（重複ロード防止） */
let loadingPromise: Promise<FFmpeg> | null = null;

/**
 * FFmpegインスタンスをシングルトンで返す。
 * WASMバイナリの重複ロードを防ぎ、初回以降はキャッシュを再利用する。
 * 呼び出し側でterminate()しないこと。
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  if (cachedFFmpeg) {
    return cachedFFmpeg;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: coreUrl,
      wasmURL: wasmUrl,
    });
    cachedFFmpeg = ffmpeg;
    loadingPromise = null;
    return ffmpeg;
  })();

  return loadingPromise;
}
