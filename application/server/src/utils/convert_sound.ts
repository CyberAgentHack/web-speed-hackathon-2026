import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface ConvertResult {
  mp3Buffer: Buffer;
  artist: string;
  title: string;
  peaks: number[];
}

/**
 * 音声ファイルをMP3に変換し、メタデータを抽出する（1パス）
 * - 入力ファイルをtmpに書き出し、ffmpegでMP3変換 + ffmetadata出力を同時に行う
 * - Shift_JISメタデータはUTF-8に変換
 */
export async function convertAndExtractSound(input: Buffer): Promise<ConvertResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, `input-${randomUUID()}`);
  const outputPath = path.join(tmpDir, `output-${randomUUID()}.mp3`);
  const metaPath = path.join(tmpDir, `meta-${randomUUID()}.txt`);

  try {
    await fs.writeFile(inputPath, input);

    // メタデータ抽出（ffmetadata形式で出力）
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-f", "ffmetadata"])
        .output(metaPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    // MP3変換
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-vn"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    const mp3Buffer = await fs.readFile(outputPath);
    const { artist, title } = await extractMetadata(metaPath);
    const peaks = await extractPeaks(outputPath, tmpDir);

    return { mp3Buffer, artist, title, peaks };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function extractMetadata(metaPath: string): Promise<{ artist: string; title: string }> {
  try {
    const raw = await fs.readFile(metaPath);
    let outputUtf8: string;
    try {
      outputUtf8 = new TextDecoder("utf-8", { fatal: true }).decode(raw);
    } catch {
      outputUtf8 = new TextDecoder("shift_jis").decode(raw);
    }

    const meta = parseFFmetadata(outputUtf8);

    return {
      artist: meta["artist"] ?? UNKNOWN_ARTIST,
      title: meta["title"] ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  }
}

function parseFFmetadata(ffmetadata: string): Partial<Record<string, string>> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx)!.trim().toLowerCase(), line.slice(idx + 1)!.trim()];
      }),
  );
}

const PEAK_CHUNKS = 100;

/**
 * 音声ファイルから100個のピーク値を抽出する
 * ffmpegでモノラルs16le PCMに変換し、チャンク平均を計算
 */
export async function extractPeaks(audioPath: string, tmpDir: string): Promise<number[]> {
  const pcmPath = path.join(tmpDir, `pcm-${randomUUID()}.raw`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(audioPath)
      .outputOptions(["-ac", "1", "-f", "s16le", "-acodec", "pcm_s16le"])
      .output(pcmPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  const pcmBuffer = await fs.readFile(pcmPath);
  const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength / 2);

  const chunkSize = Math.ceil(samples.length / PEAK_CHUNKS);
  const peaks: number[] = [];

  for (let i = 0; i < samples.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, samples.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += Math.abs(samples[j]!);
    }
    peaks.push(sum / (end - i));
  }

  // 0-1 に正規化
  const max = Math.max(...peaks, 1);
  return peaks.map((p) => Math.round((p / max) * 1000) / 1000);
}
