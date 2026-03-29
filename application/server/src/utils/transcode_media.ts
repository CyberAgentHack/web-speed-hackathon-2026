import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import * as MusicMetadata from "music-metadata";

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface SoundConversionResult {
  artist: string;
  audio: Buffer;
  title: string;
}

/**
 * ffmpeg コマンドを実行する関数
 * @param args ffmpeg に渡すオプション配列
 */
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // ffmpeg プロセスを子プロセスとして起動
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      ...args,
    ]);
    let stderr = "";

    // ffmpeg から出力されるエラー文字列を蓄積
    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });

    // ffmpeg の処理完了時のハンドリング
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(stderr.trim() || `ffmpeg exited with code ${String(code)}`),
      );
    });

    // ffmpeg が起動できなかった場合のエラー
    ffmpeg.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * 動画ファイルを ffmpeg で MP4 にエンコード
 * 最初の5秒を正方形で切り出す
 * @param data エンコード対象の生動画データ
 */
export async function convertMovieToMp4(data: Buffer): Promise<Buffer> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "cax-movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    await writeFile(inputPath, data);

    await runFfmpeg([
      "-i",
      inputPath, // 入力ファイル
      "-t",
      "5", // 最初の5秒間だけを切り出す
      "-r",
      "10", // フレームレート(1秒あたりのコマ数)を10に落として軽量化
      "-vf",
      "crop='min(iw,ih)':'min(iw,ih)',format=yuv420p", // 動画を正方形にトリミング
      "-c:v",
      "libx264", // H.264 ビデオコーデックを使用
      "-crf",
      "32", // 画質の圧縮率(数値が高いほど荒いが高圧縮)
      "-preset",
      "veryslow", // 変換処理に時間をかけて圧縮率を高める
      "-movflags",
      "+faststart", // Web上ですぐに再生開始(ストリーミング)できるようにする
      "-an", // 音声トラックを削除
      outputPath, // 出力先ファイルパス
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }
}

/**
 * 音声ファイルから曲名・アーティスト名を抽出
 * MP3 へエンコードする
 * @param data エンコード対象の生音声データ
 */
export async function convertSoundToMp3(
  data: Buffer,
): Promise<SoundConversionResult> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "cax-sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp3");

  try {
    // メタデータの抽出を試みる
    const metadata = await MusicMetadata.parseBuffer(data).catch(
      () => undefined,
    );
    const artist = metadata?.common.artist ?? UNKNOWN_ARTIST;
    const title = metadata?.common.title ?? UNKNOWN_TITLE;

    await writeFile(inputPath, data);

    await runFfmpeg([
      "-i",
      inputPath, // 入力ファイル
      "-metadata",
      `artist=${artist}`, // アーティストを埋め込む
      "-metadata",
      `title=${title}`, // 曲名を埋め込む
      "-vn", // 映像トラックが含まれていた場合は削除
      outputPath, // 出力先ファイルパス
    ]);

    return {
      artist,
      audio: await readFile(outputPath),
      title,
    };
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }
}
