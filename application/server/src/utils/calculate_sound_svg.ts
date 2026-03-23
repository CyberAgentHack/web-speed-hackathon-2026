import fs from "fs/promises";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

interface ParsedData {
  max: number;
  peaks: number[];
}

const mean = (arr: (number | undefined)[]): number => {
  let sum = 0;
  let count = 0;
  for (const v of arr) {
    if (v != null) {
      sum += v;
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

/**
 * 音声ファイルからpeaksデータを計算する
 * FFmpegでraw PCM (f32le, stereo) にデコードし、100分割のpeaksを返す
 */
export const calculatePeaks = async (
  soundFilePath: string,
): Promise<ParsedData> => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "peaks-"));
  const outputPath = path.join(tmpDir, "output.raw");

  try {
    // FFmpegでraw PCM (32bit float, little-endian, stereo) に変換
    await new Promise<void>((resolve, reject) => {
      ffmpeg(soundFilePath)
        .noVideo()
        .outputOptions("-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2")
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    const rawBuffer = await fs.readFile(outputPath);
    const samples = new Float32Array(
      rawBuffer.buffer,
      rawBuffer.byteOffset,
      rawBuffer.byteLength / 4,
    );

    // stereo: 偶数=left, 奇数=right
    const sampleCount = samples.length / 2;
    const leftData = new Array<number>(sampleCount);
    const rightData = new Array<number>(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      leftData[i] = Math.abs(samples[i * 2]!);
      rightData[i] = Math.abs(samples[i * 2 + 1]!);
    }

    const normalized = leftData.map((l, i) => mean([l, rightData[i]]));
    const chunks = chunk(normalized, Math.ceil(normalized.length / 100));
    const peaks = chunks.map(mean);
    const max = Math.max(...peaks);

    return { max, peaks };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
};
