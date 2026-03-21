import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegPath from "ffmpeg-static";

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface ConvertResult {
  mp3Buffer: Buffer;
  artist: string;
  title: string;
  peaks: number[];
}

/**
 * 音声ファイルをMP3に変換し、メタデータとピークを抽出する
 * - ピーク抽出は入力バッファから直接計算（ffmpeg 不要）
 * - ffmpeg は MP3 変換 + メタデータ抽出のみ（単一プロセス）
 */
export async function convertAndExtractSound(input: Buffer): Promise<ConvertResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, `input-${randomUUID()}`);
  const outputMp3 = path.join(tmpDir, `output.mp3`);
  const outputMeta = path.join(tmpDir, `meta.txt`);

  try {
    await fs.writeFile(inputPath, input);

    // ピーク抽出は WAV バッファから直接（ffmpeg 不要）
    const peaksPromise = Promise.resolve(extractPeaksFromWavBuffer(input));

    // ffmpeg: MP3 変換 + メタデータ抽出（1プロセス2出力）
    await new Promise<void>((resolve, reject) => {
      execFile(
        ffmpegPath!,
        [
          "-i", inputPath,
          "-vn", "-q:a", "9", outputMp3,
          "-f", "ffmetadata", outputMeta,
          "-y",
        ],
        { timeout: 120_000 },
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    const [mp3Buffer, { artist, title }, peaks] = await Promise.all([
      fs.readFile(outputMp3),
      extractMetadata(outputMeta),
      peaksPromise,
    ]);

    return { mp3Buffer, artist, title, peaks };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * WAV バッファから直接ピーク値を抽出する（ffmpeg 不要）
 * WAV ヘッダをパースして PCM データ位置を特定し、100チャンクの平均を計算
 */
function extractPeaksFromWavBuffer(buf: Buffer): number[] {
  // "data" チャンクを探す
  let dataOffset = 12; // RIFF ヘッダ (12 bytes) の後
  let dataSize = 0;
  while (dataOffset < buf.length - 8) {
    const chunkId = buf.toString("ascii", dataOffset, dataOffset + 4);
    const chunkSize = buf.readUInt32LE(dataOffset + 4);
    if (chunkId === "data") {
      dataOffset += 8;
      dataSize = chunkSize;
      break;
    }
    dataOffset += 8 + chunkSize;
    // パディング（奇数サイズの場合）
    if (chunkSize % 2 !== 0) dataOffset++;
  }

  if (dataSize === 0) {
    return new Array(PEAK_CHUNKS).fill(0);
  }

  // fmt チャンクからチャンネル数とビット深度を取得
  const channels = buf.readUInt16LE(22);
  const bitsPerSample = buf.readUInt16LE(34);
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(dataSize / (bytesPerSample * channels));

  // モノラル化 + ピーク計算（16bit を想定、それ以外は 16bit として扱う）
  const chunkSize = Math.ceil(totalSamples / PEAK_CHUNKS);
  const peaks: number[] = [];

  for (let chunk = 0; chunk < PEAK_CHUNKS; chunk++) {
    const start = chunk * chunkSize;
    const end = Math.min(start + chunkSize, totalSamples);
    if (start >= totalSamples) {
      peaks.push(0);
      continue;
    }
    let sum = 0;
    for (let i = start; i < end; i++) {
      // 全チャンネルの平均をモノラル値とする
      let monoVal = 0;
      for (let ch = 0; ch < channels; ch++) {
        const bytePos = dataOffset + (i * channels + ch) * bytesPerSample;
        if (bytePos + 1 < buf.length) {
          monoVal += buf.readInt16LE(bytePos);
        }
      }
      sum += Math.abs(monoVal / channels);
    }
    peaks.push(sum / (end - start));
  }

  const max = Math.max(...peaks, 1);
  return peaks.map((p) => Math.round((p / max) * 1000) / 1000);
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

// extractPeaks は外部から呼ばれている場合に備えてエクスポート維持
export async function extractPeaks(audioPath: string, tmpDir: string): Promise<number[]> {
  const pcmPath = path.join(tmpDir, `pcm-${randomUUID()}.raw`);

  await new Promise<void>((resolve, reject) => {
    execFile(
      ffmpegPath!,
      ["-i", audioPath, "-ac", "1", "-ar", "8000", "-f", "s16le", "-acodec", "pcm_s16le", pcmPath, "-y"],
      { timeout: 60_000 },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
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

  const max = Math.max(...peaks, 1);
  return peaks.map((p) => Math.round((p / max) * 1000) / 1000);
}
