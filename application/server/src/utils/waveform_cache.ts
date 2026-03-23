import * as fs from "node:fs";
import * as path from "node:path";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

interface WaveformData {
  peaks: number[];
  max: number;
}

const cache = new Map<string, WaveformData>();

function calculateWaveformFromBuffer(buffer: Buffer): WaveformData {
  // MP3のrawバイトからピーク値を計算（簡易RMS）
  // ブラウザ版と同等の100バーの波形を生成
  const numBars = 100;
  const chunkSize = Math.ceil(buffer.length / numBars);
  const peaks: number[] = [];

  for (let i = 0; i < buffer.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, buffer.length);
    let sum = 0;
    let count = 0;
    for (let j = i; j < end; j++) {
      // バイト値を-128..127の範囲にして絶対値を取る
      const sample = Math.abs((buffer[j]! & 0xff) - 128);
      sum += sample;
      count++;
    }
    peaks.push(count > 0 ? sum / count : 0);
  }

  const max = Math.max(...peaks, 1);
  return { peaks, max };
}

export function precomputeWaveforms(): void {
  const dirs = [path.join(PUBLIC_PATH, "sounds"), path.join(UPLOAD_PATH, "sounds")];

  for (const soundsDir of dirs) {
    if (!fs.existsSync(soundsDir)) continue;

    const files = fs.readdirSync(soundsDir).filter((f) => f.endsWith(".mp3"));
    for (const file of files) {
      const soundId = path.basename(file, ".mp3");
      if (cache.has(soundId)) continue;
      const filePath = path.join(soundsDir, file);
      const buffer = fs.readFileSync(filePath);
      cache.set(soundId, calculateWaveformFromBuffer(buffer));
    }
  }
}

export function getWaveform(soundId: string): WaveformData | undefined {
  return cache.get(soundId);
}
